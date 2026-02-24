const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { toCamel, toSnake, transformMenuItem } = require('../lib/transform');

// GET /api/menu - List all menu items (with filters)
router.get('/', async (req, res) => {
  try {
    const { category, available, search, popular, veg } = req.query;

    let query = supabase
      .from('menu_items')
      .select('*, categories(id, name, icon, color)');

    if (category) query = query.eq('category_id', category);
    if (available !== undefined) query = query.eq('available', available === 'true');
    if (veg !== undefined) query = query.eq('is_veg', veg === 'true');
    if (popular === 'true') query = query.eq('is_popular', true);
    if (search) query = query.ilike('name', `%${search}%`);

    query = query.order('is_popular', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const items = data.map(transformMenuItem);
    res.json({ success: true, data: items, count: items.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/menu/:id - Get single item
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, categories(id, name, icon, color)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: transformMenuItem(data) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/menu - Create menu item
router.post('/', async (req, res) => {
  try {
    const body = { ...req.body };

    // Map `category` field from frontend to `category_id`
    if (body.category) {
      body.category_id = body.category;
      delete body.category;

      // Fetch category name
      const { data: cat } = await supabase
        .from('categories')
        .select('name')
        .eq('id', body.category_id)
        .single();
      if (cat) body.category_name = cat.name;
    }

    // Remove _id if frontend sends it
    delete body._id;

    const insert = toSnake(body);
    const { data, error } = await supabase
      .from('menu_items')
      .insert(insert)
      .select('*, categories(id, name, icon, color)')
      .single();

    if (error) throw error;

    // Update category item count
    if (data.category_id) {
      let incremented = false;
      try {
        const { error: incError } = await supabase.rpc('increment_column', {
          table_name: 'categories',
          column_name: 'item_count',
          row_id: data.category_id,
          amount: 1,
        });
        if (!incError) incremented = true;
      } catch {
        incremented = false;
      }

      if (!incremented) {
        try {
          const { data: cat } = await supabase
            .from('categories')
            .select('item_count')
            .eq('id', data.category_id)
            .single();
          if (cat) {
            await supabase
              .from('categories')
              .update({ item_count: (cat.item_count || 0) + 1 })
              .eq('id', data.category_id);
          }
        } catch {}
      }
    }

    res.status(201).json({ success: true, data: transformMenuItem(data) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/menu/:id - Update menu item
router.put('/:id', async (req, res) => {
  try {
    const body = { ...req.body };

    // Map `category` → `category_id`
    if (body.category) {
      body.category_id = body.category;
      delete body.category;

      const { data: cat } = await supabase
        .from('categories')
        .select('name')
        .eq('id', body.category_id)
        .single();
      if (cat) body.category_name = cat.name;
    }

    delete body._id;
    const updates = toSnake(body);
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, categories(id, name, icon, color)')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Item not found' });

    // Check inventory alerts
    await checkInventoryAlert(data);

    res.json({ success: true, data: transformMenuItem(data) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/menu/:id/availability - Toggle availability
router.patch('/:id/availability', async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('menu_items')
      .select('available')
      .eq('id', req.params.id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!existing) return res.status(404).json({ success: false, error: 'Item not found' });

    const newAvailable = req.body.available !== undefined ? req.body.available : !existing.available;

    const { data, error } = await supabase
      .from('menu_items')
      .update({ available: newAvailable, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*, categories(id, name, icon, color)')
      .single();

    if (error) throw error;
    res.json({ success: true, data: transformMenuItem(data) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/menu/:id/special - Toggle today's special
router.patch('/:id/special', async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('menu_items')
      .select('is_todays_special, special_label')
      .eq('id', req.params.id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!existing) return res.status(404).json({ success: false, error: 'Item not found' });

    const newSpecial = req.body.isTodaysSpecial !== undefined ? req.body.isTodaysSpecial : !existing.is_todays_special;
    const label = req.body.specialLabel || existing.special_label || '';

    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_todays_special: newSpecial, special_label: label, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*, categories(id, name, icon, color)')
      .single();

    if (error) throw error;
    res.json({ success: true, data: transformMenuItem(data) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/menu/:id/stock - Update stock quantity
router.patch('/:id/stock', async (req, res) => {
  try {
    const { stockQty } = req.body;

    const { data, error } = await supabase
      .from('menu_items')
      .update({ stock_qty: stockQty, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*, categories(id, name, icon, color)')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Item not found' });

    await checkInventoryAlert(data);

    res.json({ success: true, data: transformMenuItem(data) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/menu/:id - Delete menu item
router.delete('/:id', async (req, res) => {
  try {
    // Fetch item first to get category_id for count decrement
    const { data: item, error: fetchErr } = await supabase
      .from('menu_items')
      .select('category_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !item) return res.status(404).json({ success: false, error: 'Item not found' });

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    // Decrement category item count
    if (item.category_id) {
      const { data: cat } = await supabase
        .from('categories')
        .select('item_count')
        .eq('id', item.category_id)
        .single();
      if (cat) {
        await supabase
          .from('categories')
          .update({ item_count: Math.max(0, (cat.item_count || 0) - 1) })
          .eq('id', item.category_id);
      }
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: check and create/update inventory alerts
async function checkInventoryAlert(item) {
  const itemId = item.id;
  const stockQty = item.stock_qty;
  const minStockQty = item.min_stock_qty;

  if (stockQty <= 0) {
    // Upsert: check if active alert exists
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
  } else if (stockQty <= minStockQty) {
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
  } else {
    // Resolve any existing alerts
    await supabase
      .from('inventory_alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('menu_item_id', itemId)
      .eq('resolved', false);
  }
}

module.exports = router;
