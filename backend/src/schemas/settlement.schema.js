import { z } from 'zod';

export const createSettlementSchema = z.object({
  body: z.object({
    groupId: z.number().int().positive().optional(),
    paidById: z.number().int().positive('Payer ID must be positive'),
    paidToId: z.number().int().positive('Payee ID must be positive'),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().default('USD')
  })
});
