import { SplitShare, SplitType } from './types';
import { roundTo2 } from './format';

/**
 * Calculate share amounts for each participant based on the split type.
 * Handles rounding correctly: the first participant absorbs the rounding remainder
 * so the total always equals the expense amount exactly.
 */
export function calculateSplit(
  totalAmount: number,
  participantIds: string[],
  splitType: SplitType,
  customShares?: Record<string, number>
): SplitShare[] {
  if (participantIds.length === 0) return [];

  const shares: SplitShare[] = [];

  if (splitType === 'equal') {
    const baseShare = totalAmount / participantIds.length;
    const baseRounded = roundTo2(baseShare);
    const totalRounded = baseRounded * participantIds.length;
    const remainder = roundTo2(totalAmount - totalRounded);

    participantIds.forEach((userId, index) => {
      const shareAmount = index === 0 ? roundTo2(baseRounded + remainder) : baseRounded;
      shares.push({
        userId,
        shareAmount,
        percentage: roundTo2((shareAmount / totalAmount) * 100),
      });
    });
  } else if (splitType === 'exact' && customShares) {
    participantIds.forEach((userId) => {
      const amount = customShares[userId] || 0;
      shares.push({
        userId,
        shareAmount: roundTo2(amount),
        percentage: roundTo2((amount / totalAmount) * 100),
      });
    });
  } else if (splitType === 'percentage' && customShares) {
    participantIds.forEach((userId) => {
      const pct = customShares[userId] || 0;
      shares.push({
        userId,
        shareAmount: roundTo2((totalAmount * pct) / 100),
        percentage: roundTo2(pct),
      });
    });
  }

  return shares;
}

/**
 * Validate that the split total matches the expense amount.
 */
export function validateSplit(
  totalAmount: number,
  splitType: SplitType,
  participantIds: string[],
  customShares?: Record<string, number>
): { valid: boolean; error?: string } {
  if (participantIds.length === 0) {
    return { valid: false, error: 'Please select at least one member.' };
  }

  if (totalAmount <= 0) {
    return { valid: false, error: 'Amount must be greater than zero.' };
  }

  if (splitType === 'exact' && customShares) {
    const total = participantIds.reduce((sum, id) => sum + (customShares[id] || 0), 0);
    if (Math.abs(roundTo2(total) - roundTo2(totalAmount)) > 0.01) {
      return {
        valid: false,
        error: `Split doesn't add up to the total amount. Difference: ${roundTo2(totalAmount - total).toFixed(2)}`,
      };
    }
  }

  if (splitType === 'percentage' && customShares) {
    const totalPct = participantIds.reduce((sum, id) => sum + (customShares[id] || 0), 0);
    if (Math.abs(roundTo2(totalPct) - 100) > 0.01) {
      return {
        valid: false,
        error: `Percentages must add up to 100%. Current total: ${roundTo2(totalPct)}%`,
      };
    }
  }

  return { valid: true };
}
