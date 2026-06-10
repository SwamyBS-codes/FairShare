import prisma from '../db/index.js';

export const createSettlement = async ({ groupId, paidById, paidToId, amount, currency = 'USD' }) => {
  return prisma.settlement.create({
    data: {
      group: groupId ? { connect: { id: groupId } } : undefined,
      paidBy: { connect: { id: paidById } },
      paidTo: { connect: { id: paidToId } },
      amount,
      currency,
      settled: true
    },
    include: {
      paidBy: { select: { id: true, name: true } },
      paidTo: { select: { id: true, name: true } }
    }
  });
};

export const getGroupSettlements = async (groupId) => {
  return prisma.settlement.findMany({
    where: { groupId },
    include: {
      paidBy: { select: { id: true, name: true } },
      paidTo: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getUserSettlements = async (userId) => {
  return prisma.settlement.findMany({
    where: {
      OR: [{ paidById: userId }, { paidToId: userId }]
    },
    include: {
      paidBy: { select: { id: true, name: true } },
      paidTo: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getUserBalance = async (userId) => {
  const settlements = await getUserSettlements(userId);
  let balance = 0;
  settlements.forEach((s) => {
    if (s.paidById === userId) {
      balance -= s.amount; // user paid out
    } else {
      balance += s.amount; // user received payment
    }
  });
  return { userId, balance, settlements };
};
