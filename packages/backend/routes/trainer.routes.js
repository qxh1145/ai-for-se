import express from 'express';
import authGuard from '../middleware/auth.guard.js';
import { requireTrainer } from '../middleware/role.guard.js';

const router = express.Router();

router.get('/tools', authGuard, requireTrainer, (req, res) => {
  res.json({ success: true, message: 'Trainer tools accessible', timestamp: new Date().toISOString() });
});

export default router;

