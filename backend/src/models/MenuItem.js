const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    available: { type: Boolean, default: true },
    stockQty: { type: Number, default: 100 },
    minStockQty: { type: Number, default: 10 },
    prepTime: { type: Number, default: 10 }, // minutes
    calories: { type: Number, default: 0 },
    rating: { type: Number, default: 4.0 },
    ratingCount: { type: Number, default: 0 },
    isVeg: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    isTodaysSpecial: { type: Boolean, default: false },
    specialLabel: { type: String, default: '' },
    addons: [
      {
        name: { type: String },
        price: { type: Number },
      },
    ],
    tags: [String],
  },
  { timestamps: true }
);

menuItemSchema.index({ category: 1, available: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
