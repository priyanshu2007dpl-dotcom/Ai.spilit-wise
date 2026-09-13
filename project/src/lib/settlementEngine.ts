import { MemberBalance, SettlementTransaction } from './types';
import { roundTo2 } from './format';

/**
 * Minimize the number of transactions needed to settle all balances.
 *
 * Algorithm:
 * 1. Separate members into creditors (positive balance) and debtors (negative balance).
 * 2. Sort creditors descending, debtors ascending (most negative first).
 * 3. Greedily match the largest debtor to the largest creditor.
 * 4. Repeat until all balances are settled.
 *
 * This produces a minimal set of transactions.
 */
export function calculateSettlements(balances: MemberBalance[]): SettlementTransaction[] {
  const creditors = balances
    .filter((b) => b.net > 0.01)
    .map((b) => ({ userId: b.userId, amount: b.net }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = balances
    .filter((b) => b.net < -0.01)
    .map((b) => ({ userId: b.userId, amount: Math.abs(b.net) }))
    .sort((a, b) => b.amount - a.amount);

  const transactions: SettlementTransaction[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    const settleAmount = roundTo2(Math.min(creditor.amount, debtor.amount));

    if (settleAmount > 0.01) {
      transactions.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: settleAmount,
      });
    }

    creditor.amount = roundTo2(creditor.amount - settleAmount);
    debtor.amount = roundTo2(debtor.amount - settleAmount);

    if (creditor.amount < 0.01) ci++;
    if (debtor.amount < 0.01) di++;
  }

  return transactions;
}
