import * as groupModel from '../models/groupModel.js';

export const createGroup = async (req, res) => {
  // expected body: { name }
  try {
    const { name } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Invalid or missing `name`' });
    }

    const createdBy = req.user?.id ?? null;

    const group = await groupModel.createGroup({ name: name.trim(), createdBy });

    // optionally add the creator as a member
    if (createdBy) {
      try {
        await groupModel.addMember({ groupId: group.id, userId: createdBy });
      } catch (e) {
        // non-fatal: creator membership failed (log and continue)
        // eslint-disable-next-line no-console
        console.error('addMember (creator) failed', e);
      }
    }

    return res.status(201).json({ group });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('createGroup error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const addMember = async (req, res) => {
  // expected body: { groupId, userId }
  try {
    const { groupId, userId } = req.body || {};
    if (!groupId || !userId) {
      return res.status(400).json({ message: '`groupId` and `userId` are required' });
    }

    const member = await groupModel.addMember({ groupId: Number(groupId), userId: Number(userId) });
    return res.status(201).json({ member });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('addMember error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const listGroups = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const groups = await groupModel.listGroupsByUser(req.user.id);
    return res.status(200).json({ groups });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('listGroups error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const group = await groupModel.getGroupById(Number(groupId));
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    return res.status(200).json({ group });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getGroup error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const expenses = await groupModel.getGroupExpenses(Number(groupId));
    return res.status(200).json({ expenses });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getGroupExpenses error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getGroupBalance = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const expenses = await groupModel.getGroupExpenses(Number(groupId));
    
    // Calculate who owes whom based on expenses
    const balances = {};
    expenses.forEach((expense) => {
      expense.shares.forEach((share) => {
        const userId = share.user.id;
        if (!balances[userId]) {
          balances[userId] = { name: share.user.name, owes: 0 };
        }
        balances[userId].owes += share.shareAmount;
      });
    });

    return res.status(200).json({ groupId: Number(groupId), balances });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getGroupBalance error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const group = await groupModel.getGroupById(Number(groupId));
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const membership = await groupModel.getGroupMember({ groupId: Number(groupId), userId: req.user.id });
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    await groupModel.leaveGroup({ groupId: Number(groupId), userId: req.user.id });
    return res.status(200).json({ message: 'Left group successfully' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('leaveGroup error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const group = await groupModel.getGroupById(Number(groupId));
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.createdById && group.createdById !== req.user.id) {
      return res.status(403).json({ message: 'Only the group owner can delete this group' });
    }

    await groupModel.deleteGroupById(Number(groupId));
    return res.status(200).json({ message: 'Group deleted successfully' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('deleteGroup error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
