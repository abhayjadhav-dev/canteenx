const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { toCamel } = require('../lib/transform');

// GET /api/users - List users (profiles)
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;

    let query = supabase.from('profiles').select('*');
    if (role) query = query.eq('role', role);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data.map(toCamel) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: toCamel(data) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users/login - Login by email (for backward compat / test accounts)
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: toCamel(data) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users - Create user profile
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: req.body.id || req.body._id,
        name: req.body.name || '',
        email: req.body.email || '',
        phone: req.body.phone || '',
        role: req.body.role || 'student',
        student_id: req.body.studentId || '',
        avatar_url: req.body.avatarUrl || '',
        wallet_balance: req.body.walletBalance || 0,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data: toCamel(data) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/users/:id - Update user profile
router.put('/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.studentId !== undefined) updates.student_id = req.body.studentId;
    if (req.body.avatarUrl !== undefined) updates.avatar_url = req.body.avatarUrl;
    if (req.body.walletBalance !== undefined) updates.wallet_balance = req.body.walletBalance;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: toCamel(data) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/users/:id/wallet - Top up wallet
router.patch('/:id/wallet', async (req, res) => {
  try {
    const { amount } = req.body;

    // Fetch current balance
    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !profile) return res.status(404).json({ success: false, error: 'User not found' });

    const newBalance = (parseFloat(profile.wallet_balance) || 0) + parseFloat(amount);

    const { data, error } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data: toCamel(data) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
