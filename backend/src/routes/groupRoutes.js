import express from 'express';
import * as groupController from '../controllers/groupController.js';
import { validateRequest } from '../utils/validateRequest.js';
import { createGroupSchema, addMemberSchema } from '../schemas/group.schema.js';

const router = express.Router();

router.post('/', validateRequest(createGroupSchema), groupController.createGroup);
router.get('/', groupController.listGroups);
router.get('/:groupId', groupController.getGroup);
router.get('/:groupId/expenses', groupController.getGroupExpenses);
router.get('/:groupId/balance', groupController.getGroupBalance);
router.post('/:groupId/leave', groupController.leaveGroup);
router.delete('/:groupId', groupController.deleteGroup);
router.post('/members', validateRequest(addMemberSchema), groupController.addMember);

export default router;
