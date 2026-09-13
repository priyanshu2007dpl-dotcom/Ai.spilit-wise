import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/format';
import { SettlementStatus } from '@/lib/types';

interface SettlementCardProps {
  settlement: {
    id: string;
    from_user: string;
    to_user: string;
    amount: number;
    status: string;
    from_profile?: { name: string; id: string };
    to_profile?: { name: string; id: string };
  };
  currentUserId: string;
  currency: string;
  onAction?: (action: 'pay' | 'confirm' | 'dispute') => void;
}

const statusConfig: Record<string, { variant: 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'brown'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  initiated: { variant: 'info', label: 'Initiated' },
  paid: { variant: 'info', label: 'Waiting for confirmation' },
  confirmed: { variant: 'success', label: 'Confirmed' },
  disputed: { variant: 'danger', label: 'Disputed' },
};

export function SettlementCard({ settlement, currentUserId, currency, onAction }: SettlementCardProps) {
  const isSender = settlement.from_user === currentUserId;
  const isReceiver = settlement.to_user === currentUserId;
  const fromProfile = settlement.from_profile;
  const toProfile = settlement.to_profile;
  const statusInfo = statusConfig[settlement.status] || statusConfig.pending;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        {fromProfile && <Avatar name={fromProfile.name} id={fromProfile.id} size="sm" />}
        <ArrowRight className="w-4 h-4 text-brown-300" />
        {toProfile && <Avatar name={toProfile.name} id={toProfile.id} size="sm" />}
        <div className="flex-1 ml-1">
          <p className="text-sm font-medium text-brown-800">
            {isSender ? 'You' : fromProfile?.name} → {isReceiver ? 'You' : toProfile?.name}
          </p>
          <p className="text-lg font-semibold text-brown-900 tabular-nums">{formatCurrency(settlement.amount, currency)}</p>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      {onAction && settlement.status !== 'confirmed' && (
        <div className="flex gap-2">
          {isSender && settlement.status === 'pending' && (
            <button
              onClick={() => onAction('pay')}
              className="flex-1 text-sm font-medium bg-brown-600 text-cream-50 rounded-lg py-2 hover:bg-brown-700 transition-colors"
            >
              I've Paid
            </button>
          )}
          {isReceiver && settlement.status === 'paid' && (
            <>
              <button
                onClick={() => onAction('confirm')}
                className="flex-1 text-sm font-medium bg-success-500 text-white rounded-lg py-2 hover:bg-success-600 transition-colors"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => onAction('dispute')}
                className="flex-1 text-sm font-medium border border-danger-300 text-danger-600 rounded-lg py-2 hover:bg-danger-50 transition-colors"
              >
                Dispute
              </button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
