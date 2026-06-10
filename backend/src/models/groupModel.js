import prisma from '../db/index.js';

export const createGroup = async ({ name, createdBy }) => {
  return prisma.group.create({
    data: {
      name,
      createdBy: createdBy ? { connect: { id: createdBy } } : undefined
    }
  });
};

export const addMember = async ({ groupId, userId }) => {
  return prisma.groupMember.create({
    data: {
      group: { connect: { id: groupId } },
      user: { connect: { id: userId } }
    }
  });
};

export const getGroupById = async (groupId) => {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      createdBy: { select: { id: true, name: true, email: true } }
    }
  });
};

export const listGroupsByUser = async (userId) => {
  return prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: {
      createdBy: { select: { id: true, name: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { members: true, expenses: true, settlements: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getGroupExpenses = async (groupId) => {
  return prisma.expense.findMany({
    where: { groupId },
    include: { createdBy: { select: { id: true, name: true } }, shares: { include: { user: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: 'desc' }
  });
};

export const getGroupMember = async ({ groupId, userId }) => {
  return prisma.groupMember.findFirst({
    where: { groupId, userId },
  });
};

export const leaveGroup = async ({ groupId, userId }) => {
  const membership = await getGroupMember({ groupId, userId });
  if (!membership) return null;

  return prisma.groupMember.delete({
    where: { id: membership.id },
  });
};

export const deleteGroupById = async (groupId) => {
  return prisma.$transaction(async (tx) => {
    const expenses = await tx.expense.findMany({
      where: { groupId },
      select: { id: true },
    });

    const expenseIds = expenses.map((expense) => expense.id);

    if (expenseIds.length > 0) {
      await tx.expenseShare.deleteMany({
        where: { expenseId: { in: expenseIds } },
      });
    }

    await tx.settlement.deleteMany({ where: { groupId } });
    await tx.expense.deleteMany({ where: { groupId } });
    await tx.groupMember.deleteMany({ where: { groupId } });

    return tx.group.delete({ where: { id: groupId } });
  });
};
