import * as settlementModel from '../models/settlementModel.js';
import { getIO } from '../socket.js';

export const createSettlement = async (req, res) => {
  // expected body: { groupId?, paidById, paidToId, amount, currency }
  try {
    const { groupId, paidById, paidToId, amount, currency = 'USD' } = req.body || {};

    if (!paidById || !paidToId || !amount) {
      return res.status(400).json({ message: '`paidById`, `paidToId`, and `amount` are required' });
    }

    if (paidById === paidToId) {
      return res.status(400).json({ message: 'Cannot settle with the same user' });
    }

    const settlement = await settlementModel.createSettlement({
      groupId: groupId ?? null,
      paidById: Number(paidById),
      paidToId: Number(paidToId),
      amount: Number(amount),
      currency
    });

    // emit socket event to group room (if socket is initialized)
    try {
      const io = getIO();
      if (groupId) {
        io.to(`group_${groupId}`).emit('settlement:created', settlement);
      } else {
        io.emit('settlement:created', settlement);
      }
    } catch (e) {
      // socket not initialized — not fatal
    }

    return res.status(201).json({ settlement });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('createSettlement error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const listGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const settlements = await settlementModel.getGroupSettlements(Number(groupId));
    return res.status(200).json({ settlements });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('listGroupSettlements error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const listUserSettlements = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const settlements = await settlementModel.getUserSettlements(req.user.id);
    return res.status(200).json({ settlements });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('listUserSettlements error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getUserBalance = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const balanceData = await settlementModel.getUserBalance(req.user.id);
    return res.status(200).json(balanceData);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getUserBalance error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
