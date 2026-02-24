/**
 * Convert a Supabase (snake_case) row to the camelCase + _id format
 * the frontend expects (matching the old MongoDB shape).
 */
function toCamel(row) {
  if (row === null || row === undefined) return null;
  if (Array.isArray(row)) return row.map(toCamel);
  if (typeof row !== 'object') return row;

  const result = {};
  for (const [key, value] of Object.entries(row)) {
    // Convert snake_case → camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

    if (key === 'id') {
      result._id = value;
    }

    // Recursively convert nested objects (but not arrays or jsonb blobs)
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[camelKey] = toCamel(value);
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

/**
 * Convert camelCase input from the frontend to snake_case for Supabase inserts/updates.
 */
function toSnake(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

/**
 * Transform a menu item row: move the joined `categories` object into `category`
 * and add the _id alias so the frontend works unchanged.
 */
function transformMenuItem(row) {
  if (!row) return null;
  const item = toCamel(row);
  // Supabase join key is `categories` (the table name)
  if (row.categories) {
    item.category = toCamel(row.categories);
    delete item.categories;
  } else if (row.category_id) {
    item.category = row.category_id;
  }
  return item;
}

/**
 * Transform an order row + its joined items & user.
 */
function transformOrder(row, orderItemsArray) {
  if (!row) return null;
  const order = toCamel(row);
  // Supabase join: `profiles` → `user`
  if (row.profiles) {
    order.user = toCamel(row.profiles);
    delete order.profiles;
  }
  // Attach order items if provided separately
  if (orderItemsArray) {
    order.items = orderItemsArray.map((oi) => {
      const item = toCamel(oi);
      if (oi.menu_items) {
        item.menuItem = toCamel(oi.menu_items);
        delete item.menuItems;
      }
      return item;
    });
  }
  return order;
}

module.exports = { toCamel, toSnake, transformMenuItem, transformOrder };
