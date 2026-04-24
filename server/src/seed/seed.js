import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Pharmacy from '../models/Pharmacy.js';
import Medicine from '../models/Medicine.js';
import PharmacyStock from '../models/PharmacyStock.js';
import pharmacies from './pharmacies.js';
import medicines from './medicines.js';
import pharmacyStocks from './pharmacyStocks.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    await PharmacyStock.deleteMany({});
    await Medicine.deleteMany({});
    await Pharmacy.deleteMany({});

    const createdPharmacies = await Pharmacy.insertMany(pharmacies);
    const createdMedicines = await Medicine.insertMany(medicines);

    const pharmacyMap = new Map(createdPharmacies.map((pharmacy) => [pharmacy.name, pharmacy._id]));
    const medicineMap = new Map(createdMedicines.map((medicine) => [medicine.name, medicine._id]));

    await PharmacyStock.insertMany(
      pharmacyStocks.map((stock) => ({
        pharmacy: pharmacyMap.get(stock.pharmacy),
        medicine: medicineMap.get(stock.medicine),
        quantity: stock.quantity,
        price: stock.price,
        inStock: stock.inStock
      }))
    );

    for (const pharmacy of createdPharmacies) {
      const stockedMedicines = pharmacyStocks
        .filter((stock) => stock.pharmacy === pharmacy.name && stock.inStock && stock.quantity > 0)
        .map((stock) => stock.medicine);

      pharmacy.medicines = stockedMedicines;
      await pharmacy.save();
    }

    console.log('Seed data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed', error);
    process.exit(1);
  }
};

seed();
