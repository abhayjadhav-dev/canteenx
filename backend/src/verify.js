/**
 * CanteenX API Verification Script
 * Run: node src/verify.js
 * Set API_URL for custom base (default: http://localhost:4000/api)
 * Set VERIFY_ADMIN_TOKEN to run full suite (POST/PUT/PATCH/DELETE, orders, inventory).
 * Without token: smoke test only (health, categories, menu GET).
 */
const BASE = process.env.API_URL || 'http://localhost:4000/api';
const AUTH_TOKEN = process.env.VERIFY_ADMIN_TOKEN || '';

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (AUTH_TOKEN) opts.headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = { error: `Invalid JSON response: ${res.status}` };
  }
  return { status: res.status, ok: res.ok, data };
}

async function verify() {
  let passed = 0;
  let failed = 0;

  function check(label, condition) {
    if (condition) {
      console.log(`  ✅ ${label}`);
      passed++;
    } else {
      console.log(`  ❌ ${label}`);
      failed++;
    }
  }

  console.log('\n🔍 CanteenX API Verification\n');
  const hasAuth = !!AUTH_TOKEN;
  if (!hasAuth) console.log('(Smoke test mode – set VERIFY_ADMIN_TOKEN for full suite)\n');

  // 1. Health
  console.log('--- Health ---');
  const health = await req('GET', '/health');
  check('Health endpoint returns OK', health.ok && health.data?.status === 'ok');

  // 2. Categories
  console.log('--- Categories ---');
  const cats = await req('GET', '/categories');
  check('GET /categories returns array', cats.ok && Array.isArray(cats.data?.data));
  const catList = cats.data?.data || [];
  const firstCat = catList[0];
  if (firstCat) {
    check('Category has name', !!firstCat.name);
    check('Category has id (_id)', !!(firstCat._id || firstCat.id));
  } else {
    check('Categories response structure valid (empty DB ok)', cats.ok);
  }

  // 3. Menu Items
  console.log('--- Menu ---');
  const menu = await req('GET', '/menu');
  check('GET /menu returns array', menu.ok && Array.isArray(menu.data?.data));
  const menuList = menu.data?.data || [];
  const firstItem = menuList[0];
  if (firstItem) {
    check('Item has populated category or categoryName', (typeof firstItem?.category === 'object' && !!firstItem.category?.name) || !!firstItem?.categoryName);
    check('Item has price >= 0', typeof firstItem?.price === 'number' && firstItem.price >= 0);
  } else {
    check('Menu response structure valid (empty DB ok)', menu.ok);
  }

  // Auth-required tests (skip without token)
  if (hasAuth && firstCat && firstItem) {
    // 4. Create menu item
    console.log('--- Create Item ---');
    const newItem = await req('POST', '/menu', {
      name: 'Test Verify Item',
      description: 'Auto-created by verify script',
      price: 99,
      category: firstCat._id || firstCat.id,
      isVeg: true,
      stockQty: 25,
      prepTime: 5,
    });
    check('POST /menu creates item', newItem.ok && !!(newItem.data?.data?._id || newItem.data?.data?.id));
    const testItemId = newItem.data?.data?._id || newItem.data?.data?.id;

    if (testItemId) {
      // 5. Update menu item
      console.log('--- Update Item ---');
      const updated = await req('PUT', `/menu/${testItemId}`, { price: 109 });
      check('PUT /menu/:id updates item', updated.ok && updated.data?.data?.price === 109);

      // 6. Toggle availability
      console.log('--- Toggle Availability ---');
      const toggled = await req('PATCH', `/menu/${testItemId}/availability`, { available: false });
      check('PATCH availability works', toggled.ok && toggled.data?.data?.available === false);

      // 7. Cleanup test item
      console.log('--- Cleanup ---');
      const deleted = await req('DELETE', `/menu/${testItemId}`);
      check('DELETE /menu/:id works', deleted.ok);
    }

    // 8. Orders (structure only)
    console.log('--- Orders ---');
    const orders = await req('GET', '/orders');
    check('GET /orders returns array', orders.ok && Array.isArray(orders.data?.data));

    const stats = await req('GET', '/orders/stats');
    check('GET /orders/stats returns data', stats.ok && stats.data?.data !== undefined);

    // 9. Inventory
    console.log('--- Inventory ---');
    const alerts = await req('GET', '/inventory/alerts');
    check('GET /inventory/alerts returns array', alerts.ok && Array.isArray(alerts.data?.data));

    const summary = await req('GET', '/inventory/summary');
    check('GET /inventory/summary returns data', summary.ok && summary.data?.data?.totalItems !== undefined);
  } else if (!hasAuth) {
    console.log('--- (Skipping auth-required tests) ---');
  }

  // Summary
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} checks`);
  process.exit(failed > 0 ? 1 : 0);
}

verify().catch((err) => {
  console.error('Verification failed:', err.message);
  process.exit(1);
});
