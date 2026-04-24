import mongoose from 'mongoose';

const pharmacySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['hospital', 'pharmacy', 'medical_store'],
      default: 'pharmacy',
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    area: {
      type: String,
      required: true,
      trim: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    medicines: {
      type: [String],
      default: []
    },
    phone: {
      type: String,
      required: true
    },
    workingHours: {
      type: String,
      default: '8 AM - 10 PM'
    },
    open24Hours: {
      type: Boolean,
      default: false
    },
    emergencyService: {
      type: Boolean,
      default: false
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        //default: 'Point'
        required : true
     },
     coordinates: {
        type: [Number],
        // default : 'Point',
        required : true,
        index : '2dsphere'
      }
   }
  },
  {
    timestamps: true
  }
);

pharmacySchema.pre('validate', function syncGeoFields(next) {
  if (
    typeof this.latitude === 'number' &&
    typeof this.longitude === 'number' &&
    !Number.isNaN(this.latitude) &&
    !Number.isNaN(this.longitude)
  ) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  } else if (this.location?.coordinates?.length === 2) {
    this.longitude = this.location.coordinates[0];
    this.latitude = this.location.coordinates[1];
  }

  next();
});

pharmacySchema.index({ location: '2dsphere' });
pharmacySchema.index({ city: 1, area: 1, type: 1 });
pharmacySchema.index({ name: 'text', address: 'text', city: 'text', area: 'text', medicines: 'text', type: 'text' });

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

export default Pharmacy;
