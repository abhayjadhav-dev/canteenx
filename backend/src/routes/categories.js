const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { toCamel, toSnake } = require('../lib/transform');

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: data.map(toCamel) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Category not found' });
    res.json({ success: true, data: toCamel(data) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  try {
    const insert = toSnake(req.body);
    const { data, error } = await supabase
      .from('categories')
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data: toCamel(data) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  try {
    const updates = toSnake(req.body);
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Category not found' });
    res.json({ success: true, data: toCamel(data) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
