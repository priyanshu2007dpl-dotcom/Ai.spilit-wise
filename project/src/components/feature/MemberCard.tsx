import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/lib/format';

interface MemberCardProps {
  member: {
    user_id: string;
    role: string;
    profile?: { name: string; id: string; avatar_url?: string | null };
  };
  paid: number;
  owes: number;
  net: number;
  currency: string;
  onClick?: () => void;
}

export function MemberCard({ member, paid, owes, net, currency, onClick }: MemberCardProps) {
  const isPositive = net > 0.01;
  const isNegative = net < -0.01;
  const name = member.profile?.name || 'Unknown';

  return (
    <Card hover={!!onClick} onClick={onClick} className="p-4">
      <div className="flex items-center gap-3">
        <Avatar name={name} id={member.user_id} size="md" src={member.profile?.avatar_url} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-brown-900 truncate">{name}</h3>
            {member.role === 'admin' && (
              <span className="text-[10px] font-medium bg-brown-100 text-brown-600 px-1.5 py-0.5 rounded">Admin</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-brown-400">
            <span>Paid {formatCurrency(paid, currency)}</span>
            <span>Owes {formatCurrency(owes, currency)}</span>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-success-600' : isNegative ? 'text-danger-600' : 'text-brown-500'}`}>
            {isPositive ? '+' : isNegative ? '-' : ''}{formatCurrency(Math.abs(net), currency)}
          </p>
          <p className="text-[10px] text-brown-400">
            {isPositive ? 'gets back' : isNegative ? 'owes' : 'settled'}
          </p>
        </div>
        {onClick && <ArrowRight className="w-4 h-4 text-brown-300" />}
      </div>
    </Card>
  );
}
