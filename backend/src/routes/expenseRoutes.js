import express from 'express';
import * as expenseController from '../controllers/expenseController.js';
import { validateRequest } from '../utils/validateRequest.js';
import { createExpenseSchema } from '../schemas/expense.schema.js';

const router = express.Router();

router.post('/', validateRequest(createExpenseSchema), expenseController.createExpense);
router.get('/', expenseController.listExpenses);
router.get('/:expenseId', expenseController.getExpense);

export default router;
