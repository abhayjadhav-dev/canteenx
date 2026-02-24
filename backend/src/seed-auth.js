require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const usersToSeed = [
  {
    email: 'admin@canteenx.com',
    password: 'canteenx123',
    name: 'Admin User',
    role: 'admin',
    studentId: '',
    walletBalance: 0,
  },
  {
    email: 'student@canteenx.com',
    password: 'canteenx123',
    name: 'Test Student',
    role: 'student',
    studentId: 'STU2024001',
    walletBalance: 500,
  },
];

async function findUserByEmail(email) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function upsertProfile(user, profile) {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        student_id: profile.studentId,
        wallet_balance: profile.walletBalance,
      },
      { onConflict: 'id' }
    );
  if (error) throw error;
}

async function ensureUser(profile) {
  let user = await findUserByEmail(profile.email);
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: profile.email,
      password: profile.password,
      email_confirm: true,
      user_metadata: { name: profile.name, role: profile.role },
    });
    if (error) throw error;
    user = data.user;
  } else {
    await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      user_metadata: { name: profile.name, role: profile.role },
    });
  }

  await upsertProfile(user, profile);
  return user;
}

async function run() {
  const results = [];
  for (const profile of usersToSeed) {
    const user = await ensureUser(profile);
    results.push({ email: profile.email, id: user.id });
  }
  console.log(JSON.stringify({ seeded: results }, null, 2));
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
