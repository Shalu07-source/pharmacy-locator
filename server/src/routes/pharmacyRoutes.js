import { Router } from 'express';
import {
  getAlternativeMedicines,
  getNearbyPharmacies,
  getPharmacyById,
  searchPharmacies
} from '../controllers/pharmacyController.js';

const router = Router();

router.get('/', searchPharmacies);
router.get('/nearby', getNearbyPharmacies);
router.get('/alternatives', getAlternativeMedicines);
router.get('/:id', getPharmacyById);

export default router;
