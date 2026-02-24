const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { toCamel, toSnake, transformOrder } = require('../lib/transform');

// GET /api/orders - List orders (filterable)
router.get('/', async (req, res) => {
  try {
    const { status, user, limit = 50, page = 1 } = req.query;

    let query = supabase
      .from('orders')
      .select('*, profiles(id, name, email, student_id)', { count: 'exact' });

    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      query = query.in('status', statuses);
    }
    if (user) query = query.eq('user_id', user);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

    const { data: orders, error, count } = await query;
    if (error) throw error;

    // Fetch order_items for all orders
    const orderIds = orders.map((o) => o.id);
    let itemsMap = {};
    if (orderIds.length > 0) {
      const { data: allItems, error: itemsErr } = await supabase
        .from('order_items')
        .select('*, menu_items(id, name, image_url)')
        .in('order_id', orderIds);
      if (!itemsErr && allItems) {
        for (const oi of allItems) {
          if (!itemsMap[oi.order_id]) itemsMap[oi.order_id] = [];
          itemsMap[oi.order_id].push(oi);
        }
      }
    }

    const result = orders.map((o) => transformOrder(o, itemsMap[o.id] || []));

    res.json({ success: true, data: result, total: count || result.length, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/stats - Dashboard KPIs
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Fetch all orders today in one query
    const { data: todayOrders, error } = await supabase
      .from('orders')
      .select('status, total, payment_status, created_at, updated_at')
      .gte('created_at', todayISO);

    if (error) throw error;

    const totalToday = todayOrders.length;
    let revenueToday = 0;
    const statusMap = {};
    let prepTimeSum = 0;
    let prepTimeCount = 0;

    for (const o of todayOrders) {
      // Revenue
      if (o.payment_status === 'paid') revenueToday += parseFloat(o.total) || 0;

      // Status counts
      statusMap[o.status] = (statusMap[o.status] || 0) + 1;

      // Avg prep time for ready/collected
      if (['ready', 'collected'].includes(o.status) && o.updated_at && o.created_at) {
        const diff = (new Date(o.updated_at) - new Date(o.created_at)) / 60000;
        if (diff > 0 && diff < 300) {
          prepTimeSum += diff;
          prepTimeCount++;
        }
      }
    }

    res.json({
      success: true,
      data: {
        ordersToday: totalToday,
        revenueToday,
        avgPrepTime: prepTimeCount > 0 ? Math.round(prepTimeSum / prepTimeCount) : 12,
        statusBreakdown: statusMap,
        pending: statusMap.placed || 0,
        preparing: statusMap.preparing || 0,
        ready: statusMap.ready || 0,
        collected: statusMap.collected || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id - Single order
router.get('/:id', async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, profiles(id, name, email, student_id)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const { data: items } = await supabase
      .from('order_items')
      .select('*, menu_items(id, name, image_url)')
      .eq('order_id', order.id);

    res.json({ success: true, data: transformOrder(order, items || []) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const { items, user, customerName, paymentMethod, pickupTime, orderType, specialInstructions } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Order must contain at least one item' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const quantity = parseInt(item.quantity, 10);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid quantity in order items' });
      }

      const { data: menuItem, error: menuErr } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', item.menuItemId)
        .single();

      if (menuErr || !menuItem) {
        return res.status(400).json({ success: false, error: `Menu item ${item.menuItemId} not found` });
      }
      if (!menuItem.available) {
        return res.status(400).json({ success: false, error: `${menuItem.name} is not available` });
      }
      if (menuItem.stock_qty < quantity) {
        return res.status(400).json({
          success: false,
          error: `${menuItem.name} has only ${menuItem.stock_qty} left in stock`,
        });
      }

      const addonTotal = (item.addons || []).reduce((sum, a) => sum + (a.price || 0), 0);
      const itemTotal = (parseFloat(menuItem.price) + addonTotal) * quantity;
      subtotal += itemTotal;

      orderItems.push({
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: parseFloat(menuItem.price),
        quantity,
        addons: item.addons || [],
        special_instructions: item.specialInstructions || '',
      });

      // Decrease stock
      const newStock = Math.max(0, menuItem.stock_qty - quantity);
      await supabase
        .from('menu_items')
        .update({ stock_qty: newStock, updated_at: new Date().toISOString() })
        .eq('id', menuItem.id);

      // Sync inventory alert
      await syncInventoryAlert({
        id: menuItem.id,
        name: menuItem.name,
        stock_qty: newStock,
        min_stock_qty: menuItem.min_stock_qty,
      });
    }

    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = subtotal + tax;

    // Create the order (trigger will auto-generate order_number + token_number)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user || null,
        customer_name: customerName || 'Student',
        subtotal,
        tax,
        total,
        payment_method: paymentMethod || 'wallet',
        pickup_time: pickupTime || '',
        order_type: orderType || 'takeaway',
        special_instructions: specialInstructions || '',
        estimated_ready_time: new Date(Date.now() + 15 * 60000).toISOString(),
      })
      .select('*, profiles(id, name, email)')
      .single();

    if (orderErr) throw orderErr;

    // Insert order items
    const itemsToInsert = orderItems.map((oi) => ({ ...oi, order_id: order.id }));
    const { data: insertedItems, error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select('*, menu_items(id, name, image_url)');

    if (itemsErr) throw itemsErr;

    res.status(201).json({ success: true, data: transformOrder(order, insertedItems || []) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['placed', 'confirmed', 'preparing', 'ready', 'collected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    // Fetch current order
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // Append to status_history (JSONB array)
    const history = Array.isArray(order.status_history) ? order.status_history : [];
    history.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status changed to ${status}`,
    });

    const updates = {
      status,
      status_history: history,
      updated_at: new Date().toISOString(),
    };

    if (status === 'ready') {
      updates.estimated_ready_time = new Date().toISOString();
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, profiles(id, name, email, student_id)')
      .single();

    if (error) throw error;

    // Fetch items for the response
    const { data: items } = await supabase
      .from('order_items')
      .select('*, menu_items(id, name, image_url)')
      .eq('order_id', updated.id);

    res.json({ success: true, data: transformOrder(updated, items || []) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Helper: keep inventory alerts in sync when stock changes via orders
async function syncInventoryAlert(item) {
  const itemId = item.id;
  const stockQty = item.stock_qty;
  const minStockQty = item.min_stock_qty;

  if (stockQty <= 0) {
    const { data: existing } = await supabase
      .from('inventory_alerts')
      .select('id')
      .eq('menu_item_id', itemId)
      .eq('resolved', false)
      .single();

    const alertData = {
      menu_item_id: itemId,
      item_name: item.name,
      current_stock: stockQty,
      min_stock: minStockQty,
      severity: 'out',
      resolved: false,
    };

    if (existing) {
      await supabase.from('inventory_alerts').update(alertData).eq('id', existing.id);
    } else {
      await supabase.from('inventory_alerts').insert(alertData);
    }

    // Auto mark unavailable
    await supabase.from('menu_items').update({ available: false, updated_at: new Date().toISOString() }).eq('id', itemId);
    return;
  }

  if (stockQty <= minStockQty) {
    const severity = stockQty <= Math.floor(minStockQty / 2) ? 'critical' : 'low';

    const { data: existing } = await supabase
      .from('inventory_alerts')
      .select('id')
      .eq('menu_item_id', itemId)
      .eq('resolved', false)
      .single();

    const alertData = {
      menu_item_id: itemId,
      item_name: item.name,
      current_stock: stockQty,
      min_stock: minStockQty,
      severity,
      resolved: false,
    };

    if (existing) {
      await supabase.from('inventory_alerts').update(alertData).eq('id', existing.id);
    } else {
      await supabase.from('inventory_alerts').insert(alertData);
    }
    return;
  }

  // Resolve any existing alerts
  await supabase
    .from('inventory_alerts')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('menu_item_id', itemId)
    .eq('resolved', false);
}

module.exports = router;
