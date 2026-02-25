const supabase = require('./lib/supabase');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const authUser = userData.user;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ success: false, error: 'Profile not found for user' });
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role || authUser.user_metadata?.role || 'student',
      studentId: profile.student_id || '',
      walletBalance: Number(profile.wallet_balance) || 0,
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};

