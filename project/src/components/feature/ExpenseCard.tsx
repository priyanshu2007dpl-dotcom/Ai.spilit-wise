import { Utensils, Car, BedDouble, ShoppingBag, Clapperboard, ShoppingCart, Receipt, Ticket, Package, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { ExpenseCategory } from '@/lib/types';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const categoryIcons: Record<string, typeof Utensils> = {
  food: Utensils,
  transport: Car,
  hotel: BedDouble,
  shopping: ShoppingBag,
  entertainment: Clapperboard,
  groceries: ShoppingCart,
  bills: Receipt,
  tickets: Ticket,
  other: Package,
};

interface ExpenseCardProps {
  expense: {
    id: string;
    group_id: string;
    description: string;
    amount: number;
    paid_by: string;
    category: string;
    split_type: string;
    expense_date: string;
    created_at: string;
    payer?: { name: string; id: string; avatar_url?: string | null };
    participants?: { user_id: string; share_amount: number; profile?: { name: string; id: string } }[];
  };
  currentUserId: string;
  currency: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpenseCard({ expense, currentUserId, currency, onEdit, onDelete }: ExpenseCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const Icon = categoryIcons[expense.category] || Package;
  const canManage = expense.paid_by === currentUserId;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const myShare = expense.participants?.find((p) => p.user_id === currentUserId)?.share_amount || 0;
  const participantNames = expense.participants
    ?.map((p) => p.profile?.name || 'Unknown')
    .join(', ');

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-cream-200 flex items-center justify-center text-brown-600 flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-brown-900 truncate">{expense.description}</h3>
              <p className="text-xs text-brown-400 mt-0.5">{formatDate(expense.expense_date)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-semibold text-brown-900 tabular-nums">{formatCurrency(expense.amount, currency)}</span>
              {canManage && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-1 rounded-lg text-brown-400 hover:bg-cream-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-8 bg-white border border-cream-200 rounded-lg shadow-lg z-10 py-1 w-32">
                      <button
                        onClick={() => { setMenuOpen(false); onEdit?.(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brown-700 hover:bg-cream-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); onDelete?.(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {expense.payer && (
              <Avatar name={expense.payer.name} id={expense.payer.id} size="xs" src={expense.payer.avatar_url} />
            )}
            <span className="text-xs text-brown-500">
              Paid by <span className="font-medium text-brown-700">{expense.payer?.name || 'Unknown'}</span>
            </span>
          </div>

          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-cream-100">
            <p className="text-xs text-brown-400 truncate">
              Split: {participantNames}
            </p>
            <Badge variant={expense.paid_by === currentUserId ? 'success' : myShare > 0 ? 'danger' : 'neutral'}>
              {expense.paid_by === currentUserId
                ? `You get ${formatCurrency(expense.amount - myShare, currency)}`
                : myShare > 0
                ? `You owe ${formatCurrency(myShare, currency)}`
                : 'Not involved'}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
