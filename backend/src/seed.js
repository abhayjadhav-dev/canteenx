require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');
const Order = require('./models/Order');
const InventoryAlert = require('./models/InventoryAlert');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canteenx';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear existing data (drop collections to reset indexes)
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    await mongoose.connection.db.dropCollection(col.name);
  }
  console.log('Cleared existing data');

  // Create categories
  const categories = await Category.create([
    { name: 'Snacks', icon: 'fastfood', color: '#f97415', sortOrder: 1, itemCount: 5 },
    { name: 'Meals', icon: 'lunch_dining', color: '#10b981', sortOrder: 2, itemCount: 4 },
    { name: 'Beverages', icon: 'coffee', color: '#6366f1', sortOrder: 3, itemCount: 4 },
    { name: 'Desserts', icon: 'icecream', color: '#ec4899', sortOrder: 4, itemCount: 3 },
    { name: 'Breakfast', icon: 'breakfast_dining', color: '#f59e0b', sortOrder: 5, itemCount: 3 },
  ]);
  console.log(`Created ${categories.length} categories`);

  const catMap = {};
  categories.forEach((c) => (catMap[c.name] = c._id));

  // Create menu items
  const menuItems = await MenuItem.create([
    // Snacks
    {
      name: 'Paneer Tikka Wrap',
      description: 'Grilled cottage cheese wrapped in a soft tortilla with mint chutney, onions, and bell peppers.',
      price: 89,
      category: catMap['Snacks'],
      categoryName: 'Snacks',
      imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400',
      available: true,
      stockQty: 45,
      minStockQty: 10,
      prepTime: 8,
      calories: 320,
      rating: 4.5,
      ratingCount: 128,
      isVeg: true,
      isPopular: true,
      addons: [
        { name: 'Extra Cheese', price: 20 },
        { name: 'Extra Paneer', price: 30 },
      ],
      tags: ['popular', 'veg', 'wrap'],
    },
    {
      name: 'Chicken Burger',
      description: 'Crispy fried chicken patty with lettuce, tomato, and special sauce in a toasted bun.',
      price: 119,
      category: catMap['Snacks'],
      categoryName: 'Snacks',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      available: true,
      stockQty: 30,
      minStockQty: 8,
      prepTime: 10,
      calories: 450,
      rating: 4.7,
      ratingCount: 256,
      isVeg: false,
      isPopular: true,
      addons: [
        { name: 'Extra Patty', price: 50 },
        { name: 'Cheese Slice', price: 15 },
        { name: 'Fries Combo', price: 40 },
      ],
      tags: ['popular', 'non-veg', 'burger'],
    },
    {
      name: 'Veg Samosa (2 pcs)',
      description: 'Crispy golden samosas filled with spiced potatoes and peas, served with tamarind chutney.',
      price: 30,
      category: catMap['Snacks'],
      categoryName: 'Snacks',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
      available: true,
      stockQty: 80,
      minStockQty: 20,
      prepTime: 5,
      calories: 180,
      rating: 4.3,
      ratingCount: 340,
      isVeg: true,
      isPopular: true,
      addons: [{ name: 'Extra Chutney', price: 5 }],
      tags: ['veg', 'quick'],
    },
    {
      name: 'French Fries',
      description: 'Crispy golden fries seasoned with herbs and served with ketchup.',
      price: 59,
      category: catMap['Snacks'],
      categoryName: 'Snacks',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
      available: true,
      stockQty: 60,
      minStockQty: 15,
      prepTime: 7,
      calories: 280,
      rating: 4.2,
      ratingCount: 190,
      isVeg: true,
      isPopular: false,
      addons: [
        { name: 'Cheese Sauce', price: 20 },
        { name: 'Peri-Peri Seasoning', price: 10 },
      ],
      tags: ['veg', 'sides'],
    },
    {
      name: 'Aloo Tikki',
      description: 'Spiced potato patties served with chutneys and topped with yogurt.',
      price: 40,
      category: catMap['Snacks'],
      categoryName: 'Snacks',
      imageUrl: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400',
      available: true,
      stockQty: 5,
      minStockQty: 10,
      prepTime: 6,
      calories: 200,
      rating: 4.1,
      ratingCount: 85,
      isVeg: true,
      isPopular: false,
      tags: ['veg', 'quick'],
    },
    // Meals
    {
      name: 'Chicken Biryani',
      description: 'Aromatic basmati rice layered with spiced chicken, saffron, and fried onions. Served with raita.',
      price: 149,
      category: catMap['Meals'],
      categoryName: 'Meals',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
      available: true,
      stockQty: 25,
      minStockQty: 8,
      prepTime: 15,
      calories: 650,
      rating: 4.8,
      ratingCount: 512,
      isVeg: false,
      isPopular: true,
      addons: [
        { name: 'Extra Raita', price: 15 },
        { name: 'Egg', price: 15 },
        { name: 'Chicken Leg Piece', price: 40 },
      ],
      tags: ['popular', 'non-veg', 'rice'],
    },
    {
      name: 'Veg Thali',
      description: 'Complete meal with dal, paneer curry, rice, roti, salad, and dessert.',
      price: 129,
      category: catMap['Meals'],
      categoryName: 'Meals',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
      available: true,
      stockQty: 20,
      minStockQty: 5,
      prepTime: 12,
      calories: 580,
      rating: 4.4,
      ratingCount: 198,
      isVeg: true,
      isPopular: true,
      addons: [
        { name: 'Extra Roti', price: 10 },
        { name: 'Sweet Lassi', price: 25 },
      ],
      tags: ['veg', 'meal', 'thali'],
    },
    {
      name: 'Pasta Alfredo',
      description: 'Creamy penne pasta with garlic, mushrooms, and parmesan cheese.',
      price: 109,
      category: catMap['Meals'],
      categoryName: 'Meals',
      imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400',
      available: true,
      stockQty: 18,
      minStockQty: 5,
      prepTime: 12,
      calories: 520,
      rating: 4.3,
      ratingCount: 143,
      isVeg: true,
      isPopular: false,
      addons: [
        { name: 'Grilled Chicken', price: 40 },
        { name: 'Garlic Bread', price: 30 },
      ],
      tags: ['veg', 'italian'],
    },
    {
      name: 'Rajma Chawal',
      description: 'North Indian kidney bean curry served with steamed basmati rice and pickle.',
      price: 89,
      category: catMap['Meals'],
      categoryName: 'Meals',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
      available: true,
      stockQty: 22,
      minStockQty: 8,
      prepTime: 10,
      calories: 480,
      rating: 4.5,
      ratingCount: 167,
      isVeg: true,
      isPopular: false,
      tags: ['veg', 'indian', 'rice'],
    },
    // Beverages
    {
      name: 'Cold Coffee',
      description: 'Chilled coffee blended with milk and ice cream topped with chocolate drizzle.',
      price: 69,
      category: catMap['Beverages'],
      categoryName: 'Beverages',
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
      available: true,
      stockQty: 50,
      minStockQty: 10,
      prepTime: 5,
      calories: 220,
      rating: 4.6,
      ratingCount: 285,
      isVeg: true,
      isPopular: true,
      addons: [
        { name: 'Whipped Cream', price: 15 },
        { name: 'Extra Shot', price: 20 },
      ],
      tags: ['popular', 'cold', 'coffee'],
    },
    {
      name: 'Mango Lassi',
      description: 'Thick and creamy yogurt-based mango smoothie with a hint of cardamom.',
      price: 59,
      category: catMap['Beverages'],
      categoryName: 'Beverages',
      imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400',
      available: true,
      stockQty: 35,
      minStockQty: 8,
      prepTime: 4,
      calories: 180,
      rating: 4.4,
      ratingCount: 156,
      isVeg: true,
      isPopular: false,
      tags: ['veg', 'mango', 'lassi'],
    },
    {
      name: 'Fresh Lime Soda',
      description: 'Refreshing lime juice with soda water, served sweet or salted.',
      price: 35,
      category: catMap['Beverages'],
      categoryName: 'Beverages',
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed514?w=400',
      available: true,
      stockQty: 0,
      minStockQty: 10,
      prepTime: 3,
      calories: 60,
      rating: 4.0,
      ratingCount: 95,
      isVeg: true,
      isPopular: false,
      tags: ['veg', 'refreshing'],
    },
    {
      name: 'Masala Chai',
      description: 'Traditional Indian spiced tea with ginger and cardamom.',
      price: 20,
      category: catMap['Beverages'],
      categoryName: 'Beverages',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
      available: true,
      stockQty: 100,
      minStockQty: 20,
      prepTime: 3,
      calories: 80,
      rating: 4.7,
      ratingCount: 420,
      isVeg: true,
      isPopular: true,
      tags: ['popular', 'hot', 'tea'],
    },
    // Desserts
    {
      name: 'Chocolate Brownie',
      description: 'Warm fudgy brownie topped with vanilla ice cream and chocolate sauce.',
      price: 79,
      category: catMap['Desserts'],
      categoryName: 'Desserts',
      imageUrl: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400',
      available: true,
      stockQty: 15,
      minStockQty: 5,
      prepTime: 5,
      calories: 380,
      rating: 4.6,
      ratingCount: 201,
      isVeg: true,
      isPopular: true,
      addons: [
        { name: 'Extra Scoop', price: 25 },
        { name: 'Nuts Topping', price: 15 },
      ],
      tags: ['popular', 'sweet', 'chocolate'],
    },
    {
      name: 'Gulab Jamun (2 pcs)',
      description: 'Soft milk-solid dumplings soaked in rose-flavored sugar syrup.',
      price: 40,
      category: catMap['Desserts'],
      categoryName: 'Desserts',
      imageUrl: 'https://images.unsplash.com/photo-1666190440493-0be267e032f0?w=400',
      available: true,
      stockQty: 30,
      minStockQty: 10,
      prepTime: 3,
      calories: 280,
      rating: 4.3,
      ratingCount: 112,
      isVeg: true,
      isPopular: false,
      tags: ['veg', 'indian', 'sweet'],
    },
    {
      name: 'Fruit Custard',
      description: 'Chilled vanilla custard with fresh seasonal fruits.',
      price: 55,
      category: catMap['Desserts'],
      categoryName: 'Desserts',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
      available: true,
      stockQty: 12,
      minStockQty: 5,
      prepTime: 2,
      calories: 190,
      rating: 4.1,
      ratingCount: 67,
      isVeg: true,
      isPopular: false,
      tags: ['veg', 'fruit', 'cold'],
    },
    // Breakfast
    {
      name: 'Masala Dosa',
      description: 'Crispy rice crepe filled with spiced potato masala, served with sambar and chutney.',
      price: 69,
      category: catMap['Breakfast'],
      categoryName: 'Breakfast',
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eb5eadaee2?w=400',
      available: true,
      stockQty: 35,
      minStockQty: 10,
      prepTime: 8,
      calories: 350,
      rating: 4.5,
      ratingCount: 230,
      isVeg: true,
      isPopular: true,
      tags: ['popular', 'veg', 'south-indian'],
    },
    {
      name: 'Poha',
      description: 'Flattened rice tempered with mustard seeds, peanuts, and fresh coriander.',
      price: 35,
      category: catMap['Breakfast'],
      categoryName: 'Breakfast',
      imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400',
      available: true,
      stockQty: 40,
      minStockQty: 10,
      prepTime: 5,
      calories: 250,
      rating: 4.2,
      ratingCount: 145,
      isVeg: true,
      isPopular: false,
      tags: ['veg', 'quick', 'light'],
    },
    {
      name: 'Bread Omelette',
      description: 'Fluffy egg omelette with vegetables served between buttered toast.',
      price: 49,
      category: catMap['Breakfast'],
      categoryName: 'Breakfast',
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400',
      available: true,
      stockQty: 3,
      minStockQty: 8,
      prepTime: 7,
      calories: 310,
      rating: 4.3,
      ratingCount: 178,
      isVeg: false,
      isPopular: false,
      tags: ['non-veg', 'egg', 'quick'],
    },
  ]);
  console.log(`Created ${menuItems.length} menu items`);

  // Create users
  const users = await User.create([
    {
      name: 'Arjun Sharma',
      email: 'arjun@university.edu',
      phone: '+91 98765 43210',
      role: 'student',
      studentId: 'STU-2024-001',
      walletBalance: 1250,
    },
    {
      name: 'Priya Patel',
      email: 'priya@university.edu',
      phone: '+91 98765 43211',
      role: 'student',
      studentId: 'STU-2024-002',
      walletBalance: 850,
    },
    {
      name: 'Admin User',
      email: 'admin@canteenx.com',
      phone: '+91 99999 00000',
      role: 'admin',
    },
  ]);
  console.log(`Created ${users.length} users`);

  // Create sample orders (sequentially to avoid orderNumber race condition)
  const orderDefs = [
    {
      user: users[0]._id,
      customerName: 'Arjun Sharma',
      items: [
        { menuItem: menuItems[5]._id, name: 'Chicken Biryani', price: 149, quantity: 1 },
        { menuItem: menuItems[9]._id, name: 'Cold Coffee', price: 69, quantity: 1 },
      ],
      subtotal: 218,
      tax: 10.9,
      total: 228.9,
      status: 'preparing',
      paymentMethod: 'wallet',
      orderType: 'takeaway',
      statusHistory: [
        { status: 'placed', timestamp: new Date(Date.now() - 15 * 60000), note: 'Order placed' },
        { status: 'confirmed', timestamp: new Date(Date.now() - 12 * 60000), note: 'Order confirmed' },
        { status: 'preparing', timestamp: new Date(Date.now() - 8 * 60000), note: 'Preparation started' },
      ],
      estimatedReadyTime: new Date(Date.now() + 7 * 60000),
    },
    {
      user: users[1]._id,
      customerName: 'Priya Patel',
      items: [
        { menuItem: menuItems[0]._id, name: 'Paneer Tikka Wrap', price: 89, quantity: 2 },
        { menuItem: menuItems[12]._id, name: 'Masala Chai', price: 20, quantity: 2 },
      ],
      subtotal: 218,
      tax: 10.9,
      total: 228.9,
      status: 'ready',
      paymentMethod: 'card',
      orderType: 'dine-in',
      statusHistory: [
        { status: 'placed', timestamp: new Date(Date.now() - 25 * 60000), note: 'Order placed' },
        { status: 'confirmed', timestamp: new Date(Date.now() - 22 * 60000), note: 'Order confirmed' },
        { status: 'preparing', timestamp: new Date(Date.now() - 18 * 60000), note: 'Preparation started' },
        { status: 'ready', timestamp: new Date(Date.now() - 2 * 60000), note: 'Order ready for pickup' },
      ],
    },
    {
      user: users[0]._id,
      customerName: 'Arjun Sharma',
      items: [
        { menuItem: menuItems[2]._id, name: 'Veg Samosa (2 pcs)', price: 30, quantity: 3 },
      ],
      subtotal: 90,
      tax: 4.5,
      total: 94.5,
      status: 'collected',
      paymentMethod: 'wallet',
      orderType: 'takeaway',
      statusHistory: [
        { status: 'placed', timestamp: new Date(Date.now() - 60 * 60000), note: 'Order placed' },
        { status: 'confirmed', timestamp: new Date(Date.now() - 58 * 60000), note: 'Confirmed' },
        { status: 'preparing', timestamp: new Date(Date.now() - 55 * 60000), note: 'Preparing' },
        { status: 'ready', timestamp: new Date(Date.now() - 48 * 60000), note: 'Ready' },
        { status: 'collected', timestamp: new Date(Date.now() - 45 * 60000), note: 'Picked up' },
      ],
    },
  ];
  const orders = [];
  for (const def of orderDefs) {
    const order = await Order.create(def);
    orders.push(order);
  }
  console.log(`Created ${orders.length} sample orders`);

  // Create inventory alerts for low/out of stock items
  const alerts = await InventoryAlert.create([
    {
      menuItem: menuItems[11]._id, // Fresh Lime Soda (0 stock)
      itemName: 'Fresh Lime Soda',
      currentStock: 0,
      minStock: 10,
      severity: 'out',
    },
    {
      menuItem: menuItems[4]._id, // Aloo Tikki (5 stock, min 10)
      itemName: 'Aloo Tikki',
      currentStock: 5,
      minStock: 10,
      severity: 'low',
    },
    {
      menuItem: menuItems[18]._id, // Bread Omelette (3 stock, min 8)
      itemName: 'Bread Omelette',
      currentStock: 3,
      minStock: 8,
      severity: 'critical',
    },
  ]);
  console.log(`Created ${alerts.length} inventory alerts`);

  console.log('\n✅ Seed data complete!');
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${menuItems.length} menu items`);
  console.log(`  - ${users.length} users`);
  console.log(`  - ${orders.length} orders`);
  console.log(`  - ${alerts.length} inventory alerts`);

  // Print user IDs for reference
  console.log('\n📋 Reference IDs:');
  users.forEach((u) => console.log(`  ${u.role}: ${u.name} -> ${u._id}`));

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
