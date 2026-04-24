import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
// import { protect } from '../middleware/authMiddleware.js'; // Use the same protect middleware

const router = Router();

// 🔒 Protected chatbot route using `protect`
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    // Temporary response (you can replace with AI later)
    const reply = `You asked about "${message}". This is a sample AI response about medicine.`;
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: 'Chatbot error' });
  }
});

export default router;