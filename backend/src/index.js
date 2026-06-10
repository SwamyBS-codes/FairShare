import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import settlementRoutes from './routes/settlementRoutes.js';
import authMiddleware from './middleware/auth.js';
import http from 'http';
import { initSocket } from './socket.js';
import * as groupModel from './models/groupModel.js';
import * as expenseModel from './models/expenseModel.js';
import * as settlementModel from './models/settlementModel.js';

dotenv.config();

const app = express();

// Enable CORS for all origins in development
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Apply auth middleware GLOBALLY so all routes can access req.user if a valid token is provided
app.use(authMiddleware);

// All routes (auth middleware will extract req.user if valid token present)
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);

const toMoney = (value) => Number((Math.round((value || 0) * 100) / 100).toFixed(2));

const buildRecentActivity = (expenses, settlements, userId) => {
  const activity = [
    ...expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      type: 'expense',
      title: expense.description?.trim() || 'Expense added',
      detail: expense.group?.name ? `Group: ${expense.group.name}` : 'Ungrouped expense',
      amount: -toMoney(expense.amount),
      createdAt: expense.createdAt,
      actor: expense.createdBy?.name || 'Unknown'
    })),
    ...settlements.map((settlement) => ({
      id: `settlement-${settlement.id}`,
      type: 'settlement',
      title: `${settlement.paidBy?.name || 'Someone'} settled with ${settlement.paidTo?.name || 'someone'}`,
      detail: settlement.group?.name ? `Group: ${settlement.group.name}` : 'Direct settlement',
      amount: settlement.paidById === userId ? -toMoney(settlement.amount) : toMoney(settlement.amount),
      createdAt: settlement.createdAt,
      actor: settlement.paidBy?.name || 'Unknown'
    }))
  ];

  return activity
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map(({ createdAt, ...item }) => ({
      ...item,
      date: new Date(createdAt).toLocaleString()
    }));
};

const buildGroupSummaries = async (groups, userId) => {
  const summaries = await Promise.all(groups.map(async (group) => {
    const [expenses, settlements] = await Promise.all([
      groupModel.getGroupExpenses(group.id),
      settlementModel.getGroupSettlements(group.id)
    ]);

    const youOwe = expenses.reduce((sum, expense) => {
      return sum + expense.shares.reduce((shareSum, share) => share.userId === userId ? shareSum + share.shareAmount : shareSum, 0);
    }, 0);

    const owedToYou = expenses.reduce((sum, expense) => {
      if (expense.createdById !== userId) return sum;
      return sum + expense.shares.reduce((shareSum, share) => share.userId !== userId ? shareSum + share.shareAmount : shareSum, 0);
    }, 0);

    const settlementReceived = settlements.reduce((sum, settlement) => settlement.paidToId === userId ? sum + settlement.amount : sum, 0);
    const settlementPaid = settlements.reduce((sum, settlement) => settlement.paidById === userId ? sum + settlement.amount : sum, 0);

    const latestExpense = expenses[0] || null;
    const netBalance = toMoney(owedToYou + settlementReceived - youOwe - settlementPaid);

    return {
      id: group.id,
      name: group.name,
      memberCount: group._count?.members ?? group.members?.length ?? 0,
      latestExpense: latestExpense ? {
        id: latestExpense.id,
        description: latestExpense.description,
        amount: latestExpense.amount,
        createdAt: latestExpense.createdAt,
        createdBy: latestExpense.createdBy?.name || 'Unknown'
      } : null,
      members: (group.members || []).map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email
      })),
      balance: netBalance,
      youOwe: toMoney(youOwe + settlementPaid),
      owedToYou: toMoney(owedToYou + settlementReceived),
      settlementCount: settlements.length
    };
  }));

  return summaries;
};

app.get('/api/dashboard', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const [groups, expenses, settlements] = await Promise.all([
      groupModel.listGroupsByUser(userId),
      expenseModel.getUserExpenses(userId),
      settlementModel.getUserSettlements(userId)
    ]);

    const youOwe = expenses.reduce((sum, expense) => {
      return sum + expense.shares.reduce((shareSum, share) => share.userId === userId ? shareSum + share.shareAmount : shareSum, 0);
    }, 0);

    const owedToYou = expenses.reduce((sum, expense) => {
      if (expense.createdById !== userId) return sum;
      return sum + expense.shares.reduce((shareSum, share) => share.userId !== userId ? shareSum + share.shareAmount : shareSum, 0);
    }, 0);

    const settlementReceived = settlements.reduce((sum, settlement) => settlement.paidToId === userId ? sum + settlement.amount : sum, 0);
    const settlementPaid = settlements.reduce((sum, settlement) => settlement.paidById === userId ? sum + settlement.amount : sum, 0);

    const groupSummaries = await buildGroupSummaries(groups, userId);

    return res.status(200).json({
      summary: {
        totalGroups: groups.length,
        totalExpenses: expenses.length,
        youOwe: toMoney(youOwe + settlementPaid),
        owedToYou: toMoney(owedToYou + settlementReceived),
        balance: toMoney(owedToYou + settlementReceived - youOwe - settlementPaid)
      },
      groups: groupSummaries,
      recentActivity: buildRecentActivity(expenses, settlements, userId),
      balances: settlements
        .filter((settlement) => settlement.paidById === userId || settlement.paidToId === userId)
        .map((settlement) => ({
          id: settlement.id,
          from: settlement.paidBy?.name || 'Unknown',
          to: settlement.paidTo?.name || 'Unknown',
          amount: settlement.amount,
          due: settlement.settled ? 'Completed' : 'Pending',
          trend: settlement.paidToId === userId ? 'incoming' : 'outgoing'
        })),
      settlements: settlements.map((settlement) => ({
        id: settlement.id,
        from: settlement.paidBy?.name || 'Unknown',
        to: settlement.paidTo?.name || 'Unknown',
        amount: settlement.amount,
        settled: settlement.settled,
        date: new Date(settlement.createdAt).toLocaleString(),
        group: settlement.group?.name || null
      }))
    });
  } catch (err) {
    console.error('dashboard error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.get('/', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
