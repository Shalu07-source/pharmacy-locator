import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    composition: {
      type: String,
      default: '',
      trim: true
    },
    alternatives: {
      type: [String],
      default: []
    },
    dosageForm: {
      type: String,
      default: ''
    },
    strength: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

medicineSchema.index({ name: 'text', category: 'text', composition: 'text', alternatives: 'text' });

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;
