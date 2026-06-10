import express from 'express';
import * as userController from '../controllers/userController.js';
import { validateRequest } from '../utils/validateRequest.js';
import { registerSchema, loginSchema } from '../schemas/user.schema.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), userController.register);
router.post('/login', validateRequest(loginSchema), userController.login);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

export default router;
