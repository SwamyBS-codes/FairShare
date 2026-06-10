import prisma from '../db/index.js';

export const createExpense = async ({ groupId, createdBy, description, amount, currency }) => {
  return prisma.expense.create({
    data: {
      group: groupId ? { connect: { id: groupId } } : undefined,
      createdBy: createdBy ? { connect: { id: createdBy } } : undefined,
      description,
      amount,
      currency
    }
  });
};

export const addExpenseShare = async ({ expenseId, userId, shareAmount }) => {
  return prisma.expenseShare.create({
    data: {
      expense: { connect: { id: expenseId } },
      user: { connect: { id: userId } },
      shareAmount
    }
  });
};

// Create expense with shares in a single atomic transaction
// If any share fails, the entire expense + shares are rolled back
export const createExpenseWithShares = async ({
  groupId,
  createdBy,
  description,
  amount,
  currency,
  shares
}) => {
  return prisma.$transaction(async (tx) => {
    // Create the expense first
    const expense = await tx.expense.create({
      data: {
        group: groupId ? { connect: { id: groupId } } : undefined,
        createdBy: createdBy ? { connect: { id: createdBy } } : undefined,
        description,
        amount,
        currency
      }
    });

    // Create all shares for this expense
    const createdShares = await Promise.all(
      shares.map((s) =>
        tx.expenseShare.create({
          data: {
            expense: { connect: { id: expense.id } },
            user: { connect: { id: s.userId } },
            shareAmount: s.shareAmount
          }
        })
      )
    );

    return { expense, shares: createdShares };
  });
};

export const getExpenseById = async (expenseId) => {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      group: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      shares: { include: { user: { select: { id: true, name: true } } } }
    }
  });
};

export const getUserExpenses = async (userId) => {
  return prisma.expense.findMany({
    where: { shares: { some: { userId } } },
    include: {
      group: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      shares: { include: { user: { select: { id: true, name: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  });
};
