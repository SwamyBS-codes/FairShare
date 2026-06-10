import prisma from '../db/index.js';

export const createUser = async ({ name, email, passwordHash }) => {
  return prisma.user.create({
    data: {
      name,
      email,
      passwordHash
    }
  });
};

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};

export const updateUser = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data
  });
};
