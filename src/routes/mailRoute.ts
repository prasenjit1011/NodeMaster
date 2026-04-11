import express from 'express';
const router = express.Router();

import { sendMail } from '../controllers/mailController.js';
router.post('/sendMail', sendMail);

export default router;
