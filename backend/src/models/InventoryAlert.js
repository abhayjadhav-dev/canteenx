const mongoose = require('mongoose');

const inventoryAlertSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    itemName: { type: String, required: true },
    currentStock: { type: Number, required: true },
    minStock: { type: Number, required: true },
    severity: {
      type: String,
      enum: ['low', 'critical', 'out'],
      default: 'low',
    },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryAlert', inventoryAlertSchema);
