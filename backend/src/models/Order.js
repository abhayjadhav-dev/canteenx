const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  addons: [{ name: String, price: Number }],
  specialInstructions: { type: String, default: '' },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    tokenNumber: { type: Number },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, default: 'Student' },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'preparing', 'ready', 'collected', 'cancelled'],
      default: 'placed',
    },
    statusHistory: [statusHistorySchema],
    paymentMethod: {
      type: String,
      enum: ['wallet', 'card', 'upi', 'cash'],
      default: 'wallet',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'paid',
    },
    pickupTime: { type: String, default: '' },
    orderType: { type: String, enum: ['dine-in', 'takeaway'], default: 'takeaway' },
    estimatedReadyTime: { type: Date },
    specialInstructions: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1001).padStart(4, '0')}`;
    this.tokenNumber = (count % 99) + 1;
    this.statusHistory = [{ status: 'placed', timestamp: new Date(), note: 'Order placed' }];
  }
  next();
});

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
