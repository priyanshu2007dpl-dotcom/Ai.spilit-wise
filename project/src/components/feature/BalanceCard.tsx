import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format';

interface BalanceCardProps {
  totalPaid: number;
  youOwe: number;
  youAreOwed: number;
  netBalance: number;
  currency: string;
}

export function BalanceCard({ totalPaid, youOwe, youAreOwed, netBalance, currency }: BalanceCardProps) {
  const isPositive = netBalance > 0.01;
  const isNegative = netBalance < -0.01;

  return (
    <Card className="p-5 bg-gradient-to-br from-brown-600 to-brown-800 text-cream-50 border-0">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-4 h-4 text-cream-300" />
        <p className="text-sm text-cream-200">Your Balance</p>
      </div>

      <div className="mb-4">
        <p className="text-xs text-cream-300 mb-1">Net Balance</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold tabular-nums ${isPositive ? 'text-success-500' : isNegative ? 'text-danger-500' : 'text-cream-100'}`}>
            {isPositive ? '+' : isNegative ? '-' : ''}{formatCurrency(Math.abs(netBalance), currency)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-cream-50/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-success-500" />
            <p className="text-xs text-cream-300">You are owed</p>
          </div>
          <p className="text-lg font-semibold text-success-500 tabular-nums">{formatCurrency(youAreOwed, currency)}</p>
        </div>
        <div className="bg-cream-50/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-danger-500" />
            <p className="text-xs text-cream-300">You owe</p>
          </div>
          <p className="text-lg font-semibold text-danger-500 tabular-nums">{formatCurrency(youOwe, currency)}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-cream-50/10">
        <div className="flex items-center justify-between">
          <p className="text-xs text-cream-300">Total you paid</p>
          <p className="text-sm font-medium text-cream-100 tabular-nums">{formatCurrency(totalPaid, currency)}</p>
        </div>
      </div>
    </Card>
  );
}
