import { Expense, ExpenseParticipant, MemberBalance } from './types';
import { roundTo2 } from './format';

/**
 * Calculate each member's balance in a group.
 * Net Balance = Total Paid - Total Share Owed
 * Positive = member should receive money
 * Negative = member owes money
 */
export function calculateBalances(
  members: { user_id: string }[],
  expenses: (Expense & { participants?: ExpenseParticipant[] })[]
): MemberBalance[] {
  const balanceMap = new Map<string, MemberBalance>();

  members.forEach((m) => {
    balanceMap.set(m.user_id, {
      userId: m.user_id,
      paid: 0,
      share: 0,
      net: 0,
    });
  });

  expenses.forEach((expense) => {
    if (!balanceMap.has(expense.paid_by)) return;

    const payerBalance = balanceMap.get(expense.paid_by)!;
    payerBalance.paid = roundTo2(payerBalance.paid + expense.amount);

    if (expense.participants) {
      expense.participants.forEach((p) => {
        const balance = balanceMap.get(p.user_id);
        if (balance) {
          balance.share = roundTo2(balance.share + p.share_amount);
        }
      });
    }
  });

  balanceMap.forEach((b) => {
    b.net = roundTo2(b.paid - b.share);
  });

  return Array.from(balanceMap.values());
}

/**
 * Get the current user's net balance across all groups.
 */
export function getNetBalanceSummary(balances: MemberBalance[]): {
  totalPaid: number;
  totalShare: number;
  net: number;
  owed: number;
  owes: number;
} {
  let totalPaid = 0;
  let totalShare = 0;

  balances.forEach((b) => {
    totalPaid = roundTo2(totalPaid + b.paid);
    totalShare = roundTo2(totalShare + b.share);
  });

  const net = roundTo2(totalPaid - totalShare);
  return {
    totalPaid,
    totalShare,
    net,
    owed: net > 0 ? net : 0,
    owes: net < 0 ? Math.abs(net) : 0,
  };
}
