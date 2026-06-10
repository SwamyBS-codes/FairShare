import { z } from 'zod';

export const createExpenseSchema = z.object({
  body: z.object({
    groupId: z.number().int().positive().optional(),
    description: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().default('USD'),
    shares: z.array(
      z.object({
        userId: z.number().int().positive('User ID must be positive'),
        shareAmount: z.number().positive('Share amount must be positive')
      })
    ).min(1, 'Shares array must have at least one element')
  })
});

export const settleExpenseSchema = z.object({
  params: z.object({
    expenseId: z.string().transform((val) => parseInt(val, 10))
  })
});
