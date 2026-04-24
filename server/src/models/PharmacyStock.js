import mongoose from 'mongoose';

const pharmacyStockSchema = new mongoose.Schema(
  {
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    inStock: {
      type: Boolean,
      default: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

pharmacyStockSchema.index({ pharmacy: 1, medicine: 1 }, { unique: true });
pharmacyStockSchema.index({ medicine: 1, inStock: 1 });

const PharmacyStock = mongoose.model('PharmacyStock', pharmacyStockSchema);

export default PharmacyStock;
