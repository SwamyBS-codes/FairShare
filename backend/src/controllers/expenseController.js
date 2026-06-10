import * as expenseModel from '../models/expenseModel.js';
import { getIO } from '../socket.js';

export const createExpense = async (req, res) => {
  // expected body: { groupId, description, amount, currency, shares }
  // shares: [{ userId, shareAmount }, ...]
  try {
    // Require authentication
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { groupId, description, amount, currency = 'USD', shares } = req.body || {};

    if (amount === undefined || isNaN(Number(amount))) {
      return res.status(400).json({ message: 'Invalid or missing `amount`' });
    }

    if (!Array.isArray(shares) || shares.length === 0) {
      return res.status(400).json({ message: '`shares` must be a non-empty array' });
    }

    const numericAmount = Number(amount);
    const totalShares = shares.reduce((s, it) => s + Number(it.shareAmount || 0), 0);
    if (Math.abs(totalShares - numericAmount) > 0.01) {
      return res.status(400).json({ message: 'Shares do not sum to the total amount' });
    }

    const createdBy = req.user.id;

    // Use transactional method to ensure expense + shares are atomic
    const { expense, shares: createdShares } = await expenseModel.createExpenseWithShares({
      groupId: groupId ?? null,
      createdBy,
      description: description ?? null,
      amount: numericAmount,
      currency,
      shares: shares.map((s) => ({
        userId: Number(s.userId),
        shareAmount: Number(s.shareAmount)
      }))
    });

    // emit socket event to group room (if socket is initialized)
    try {
      const io = getIO();
      if (groupId) {
        io.to(`group_${groupId}`).emit('expense:created', { expense, shares: createdShares });
      } else {
        io.emit('expense:created', { expense, shares: createdShares });
      }
    } catch (e) {
      // socket not initialized yet or error — not fatal
    }

    return res.status(201).json({ expense, shares: createdShares });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('createExpense error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const listExpenses = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const expenses = await expenseModel.getUserExpenses(req.user.id);
    return res.status(200).json({ expenses });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('listExpenses error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    if (!expenseId) {
      return res.status(400).json({ message: 'Expense ID is required' });
    }

    const expense = await expenseModel.getExpenseById(Number(expenseId));
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json({ expense });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getExpense error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
