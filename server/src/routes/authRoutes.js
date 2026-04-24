import { Router } from 'express';
import { signup, signin, getProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// ✅ Signup
router.post('/signup', signup);

// ✅ Signin
router.post('/signin', signin);

// ✅ Get user profile (protected route)
router.get('/profile', protect, getProfile);

export default router;
