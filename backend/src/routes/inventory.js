const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { toCamel, transformMenuItem } = require('../lib/transform');

// GET /api/inventory/alerts - List all alerts
router.get('/alerts', async (req, res) => {
  try {
    const { severity, resolved } = req.query;

    let query = supabase
      .from('inventory_alerts')
      .select('*, menu_items(id, name, image_url, category_id, stock_qty, min_stock_qty, available)');

    if (severity) query = query.eq('severity', severity);
    if (resolved !== undefined) query = query.eq('resolved', resolved === 'true');

    query = query.order('severity', { ascending: true }).order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    // Transform: map menu_items join to menuItem
    const alerts = (data || []).map((row) => {
      const alert = toCamel(row);
      if (row.menu_items) {
        alert.menuItem = toCamel(row.menu_items);
        delete alert.menuItems;
      }
      return alert;
    });

    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/inventory/summary - Inventory summary stats
router.get('/summary', async (req, res) => {
  try {
    // Count total menu items
    const { count: totalItems } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true });

    // Low stock (stock_qty > 0 AND stock_qty <= min_stock_qty)
    const { data: stockRows, error: stockErr } = await supabase
      .from('menu_items')
      .select('id, stock_qty, min_stock_qty')
      .gt('stock_qty', 0);

    if (stockErr) throw stockErr;
    const lowStock = (stockRows || []).filter(
      (row) => row.stock_qty <= (row.min_stock_qty ?? 10)
    ).length;

    // Out of stock
    const { count: outOfStock } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('stock_qty', 0);

    // Active alerts by severity
    const { count: activeAlerts } = await supabase
      .from('inventory_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false);

    const { count: critical } = await supabase
      .from('inventory_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false)
      .eq('severity', 'critical');

    const { count: low } = await supabase
      .from('inventory_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false)
      .eq('severity', 'low');

    const { count: out } = await supabase
      .from('inventory_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false)
      .eq('severity', 'out');

    res.json({
      success: true,
      data: {
        totalItems: totalItems || 0,
        lowStock,
        outOfStock: outOfStock || 0,
        activeAlerts: activeAlerts || 0,
        totalAlerts: activeAlerts || 0,
        critical: critical || 0,
        low: low || 0,
        out: out || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/inventory/restock/:itemId - Restock an item
router.patch('/restock/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ success: false, error: 'Quantity must be a positive number' });
    }

    // Fetch current stock
    const { data: item, error: fetchErr } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', req.params.itemId)
      .single();

    if (fetchErr || !item) return res.status(404).json({ success: false, error: 'Item not found' });

    const newStock = (item.stock_qty || 0) + qty;

    const { data: updated, error } = await supabase
      .from('menu_items')
      .update({ stock_qty: newStock, available: true, updated_at: new Date().toISOString() })
      .eq('id', req.params.itemId)
      .select()
      .single();

    if (error) throw error;

    // Resolve or update alerts
    if (newStock > (item.min_stock_qty || 10)) {
      await supabase
        .from('inventory_alerts')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('menu_item_id', item.id)
        .eq('resolved', false);
    } else {
      const severity = newStock <= Math.floor((item.min_stock_qty || 10) / 2) ? 'critical' : 'low';

      const { data: existing } = await supabase
        .from('inventory_alerts')
        .select('id')
        .eq('menu_item_id', item.id)
        .eq('resolved', false)
        .single();

      const alertData = {
        menu_item_id: item.id,
        item_name: item.name,
        current_stock: newStock,
        min_stock: item.min_stock_qty || 10,
        severity,
        resolved: false,
      };

      if (existing) {
        await supabase.from('inventory_alerts').update(alertData).eq('id', existing.id);
      } else {
        await supabase.from('inventory_alerts').insert(alertData);
      }
    }

    res.json({ success: true, data: toCamel(updated) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/inventory/alerts/:id/resolve - Resolve alert
router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory_alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Alert not found' });
    res.json({ success: true, data: toCamel(data) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
