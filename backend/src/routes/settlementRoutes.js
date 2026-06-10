import express from 'express';
import * as settlementController from '../controllers/settlementController.js';
import { validateRequest } from '../utils/validateRequest.js';
import { createSettlementSchema } from '../schemas/settlement.schema.js';

const router = express.Router();

router.post('/', validateRequest(createSettlementSchema), settlementController.createSettlement);
router.get('/', settlementController.listUserSettlements);
router.get('/balance', settlementController.getUserBalance);
router.get('/group/:groupId', settlementController.listGroupSettlements);

export default router;
