import { z } from 'zod';

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Group name is required')
  })
});

export const addMemberSchema = z.object({
  body: z.object({
    groupId: z.number().int().positive('Group ID must be a positive number'),
    userId: z.number().int().positive('User ID must be a positive number')
  })
});
