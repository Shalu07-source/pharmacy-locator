import 'dotenv/config';
import dotenv from "dotenv";
dotenv.config();
import app from './app.js';
import connectDB from './config/db.js';
import chatbotRoutes from './routes/chatbot.js';

app.use('/api/chatbot', chatbotRoutes);

const port = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
