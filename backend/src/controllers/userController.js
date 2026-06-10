import * as userModel from '../models/userModel.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

export const register = async (req, res) => {
  // expected body: { name, email, password }
  try {
    const { name, email, password } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Invalid or missing `name`' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Invalid or missing `email`' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: '`password` must be at least 6 characters' });
    }

    // Check if user already exists
    const existing = await userModel.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await userModel.createUser({ name: name.trim(), email, passwordHash });

    const token = signToken({ id: user.id, email: user.email });
    return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error('register error:', err.message, err.stack);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const login = async (req, res) => {
  // expected body: { email, password }
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing `email`' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing `password`' });
    }

    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken({ id: user.id, email: user.email });
    return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('login error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await userModel.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('getProfile error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name } = req.body || {};
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ message: 'Invalid `name`' });
    }

    const user = await userModel.updateUser(req.user.id, {
      ...(typeof name === 'string' ? { name: name.trim() } : {})
    });

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('updateProfile error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
