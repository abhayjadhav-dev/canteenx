/**
 * CanteenX API Verification Script
 * Run: node src/verify.js
 * Checks all critical API paths are working correctly.
 */
const BASE = process.env.API_URL || 'http://localhost:4000/api';

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
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

  // 1. Health
  console.log('--- Health ---');
  const health = await req('GET', '/health');
  check('Health endpoint returns OK', health.ok && health.data.status === 'ok');

  // 2. Categories
  console.log('--- Categories ---');
  const cats = await req('GET', '/categories');
  check('GET /categories returns array', cats.ok && Array.isArray(cats.data.data));
  check('At least 1 category exists', cats.data.data.length >= 1);
  const firstCat = cats.data.data[0];
  check('Category has name', !!firstCat?.name);

  // 3. Menu Items
  console.log('--- Menu ---');
  const menu = await req('GET', '/menu');
  check('GET /menu returns array', menu.ok && Array.isArray(menu.data.data));
  check('At least 1 item exists', menu.data.data.length >= 1);
  const firstItem = menu.data.data[0];
  check('Item has populated category.name', typeof firstItem?.category === 'object' && !!firstItem.category.name);
  check('Item has categoryName field', !!firstItem?.categoryName);
  check('Item has price > 0', firstItem?.price > 0);

  // 4. Create menu item
  console.log('--- Create Item ---');
  const newItem = await req('POST', '/menu', {
    name: 'Test Verify Item',
    description: 'Auto-created by verify script',
    price: 99,
    category: firstCat._id,
    isVeg: true,
    stockQty: 25,
    prepTime: 5,
  });
  check('POST /menu creates item', newItem.ok && !!newItem.data.data._id);
  check('Created item has populated category', typeof newItem.data.data.category === 'object');
  check('Created item has categoryName auto-set', newItem.data.data.categoryName === firstCat.name);
  const testItemId = newItem.data.data._id;

  // 5. Update menu item
  console.log('--- Update Item ---');
  const updated = await req('PUT', `/menu/${testItemId}`, { price: 109 });
  check('PUT /menu/:id updates item', updated.ok && updated.data.data.price === 109);
  check('Updated item has populated category', typeof updated.data.data.category === 'object');

  // 6. Toggle availability
  console.log('--- Toggle Availability ---');
  const toggled = await req('PATCH', `/menu/${testItemId}/availability`, { available: false });
  check('PATCH availability works', toggled.ok && toggled.data.data.available === false);

  // 7. Orders
  console.log('--- Orders ---');
  const orders = await req('GET', '/orders');
  check('GET /orders returns array', orders.ok && Array.isArray(orders.data.data));

  const stats = await req('GET', '/orders/stats');
  check('GET /orders/stats returns data', stats.ok && stats.data.data !== undefined);

  // 8. Inventory
  console.log('--- Inventory ---');
  const alerts = await req('GET', '/inventory/alerts');
  check('GET /inventory/alerts returns array', alerts.ok && Array.isArray(alerts.data.data));

  const summary = await req('GET', '/inventory/summary');
  check('GET /inventory/summary returns data', summary.ok && summary.data.data.totalItems !== undefined);

  // 9. Cleanup test item
  console.log('--- Cleanup ---');
  const deleted = await req('DELETE', `/menu/${testItemId}`);
  check('DELETE /menu/:id works', deleted.ok);

  // Summary
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} checks`);
  process.exit(failed > 0 ? 1 : 0);
}

verify().catch((err) => {
  console.error('Verification failed:', err.message);
  process.exit(1);
});
