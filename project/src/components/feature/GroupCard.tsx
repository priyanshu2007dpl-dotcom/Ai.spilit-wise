import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, Plane, Home, Heart, Briefcase, Folder } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { GROUP_CATEGORIES } from '@/lib/types';
import { LucideIcon } from 'lucide-react';

const categoryIcons: Record<string, LucideIcon> = {
  trip: Plane, friends: Users, roommates: Home, family: Heart, office: Briefcase, other: Folder,
};

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    category: string;
    created_at: string;
  };
  memberCount: number;
  totalExpenses: number;
  balance: number;
  currency: string;
  lastActivity?: string;
}

export function GroupCard({ group, memberCount, totalExpenses, balance, currency, lastActivity }: GroupCardProps) {
  const navigate = useNavigate();
  const category = GROUP_CATEGORIES.find((c) => c.value === group.category);
  const CategoryIcon = categoryIcons[category?.value || 'other'] || Users;

  return (
    <Card hover onClick={() => navigate(`/groups/${group.id}`)} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-cream-200 flex items-center justify-center text-brown-600 flex-shrink-0">
            <CategoryIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-brown-900 truncate">{group.name}</h3>
            <p className="text-xs text-brown-400">{category?.label || 'Other'}</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-brown-300 flex-shrink-0" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Users className="w-3.5 h-3.5 text-brown-400" />
        <span className="text-xs text-brown-500">{memberCount} members</span>
        <span className="text-brown-300">·</span>
        <span className="text-xs text-brown-500">{formatCurrency(totalExpenses, currency)} total</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-cream-200">
        <div>
          <p className="text-xs text-brown-400">Your balance</p>
          <p className={`text-sm font-semibold ${balance > 0.01 ? 'text-success-600' : balance < -0.01 ? 'text-danger-600' : 'text-brown-500'}`}>
            {balance > 0.01 ? `+${formatCurrency(balance, currency)}` : balance < -0.01 ? `-${formatCurrency(Math.abs(balance), currency)}` : 'Settled'}
          </p>
        </div>
        {lastActivity && (
          <p className="text-xs text-brown-400">{formatRelativeTime(lastActivity)}</p>
        )}
      </div>
    </Card>
  );
}
