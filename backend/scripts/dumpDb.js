import prisma from '../src/db/index.js';

async function main() {
  const users = await prisma.user.findMany({ take: 10 });
  const groups = await prisma.group.findMany({
    take: 10,
    include: { members: { include: { user: true } } }
  });
  const expenses = await prisma.expense.findMany({ take: 10, include: { shares: true, createdBy: true, group: true } });
  const settlements = await prisma.settlement.findMany({ take: 10, include: { paidBy: true, paidTo: true, group: true } });
  const groupMembers = await prisma.groupMember.findMany({ take: 10, include: { user: true, group: true } });

  console.log('--- USERS ---');
  console.log(JSON.stringify(users, null, 2));
  console.log('\n--- GROUPS ---');
  console.log(JSON.stringify(groups, null, 2));
  console.log('\n--- EXPENSES ---');
  console.log(JSON.stringify(expenses, null, 2));
  console.log('\n--- SETTLEMENTS ---');
  console.log(JSON.stringify(settlements, null, 2));
  console.log('\n--- GROUP MEMBERS ---');
  console.log(JSON.stringify(groupMembers, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
