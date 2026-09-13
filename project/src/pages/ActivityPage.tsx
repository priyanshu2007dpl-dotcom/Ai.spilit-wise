import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ExpenseCard } from '@/components/feature/ExpenseCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

type FilterType = 'all' | 'you_paid' | 'others_paid' | 'you_owe' | 'you_are_owed';

interface ActivityExpense {
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
  group?: { name: string };
}

export function ActivityPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ActivityExpense[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadActivity();
  }, [user]);

  const loadActivity = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupIds = (memberData || []).map((m: any) => m.group_id);
      if (groupIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: expenseData } = await supabase
        .from('expenses')
        .select('*, payer:profiles(*), participants:expense_participants(*, profile:profiles(*)), group:groups(name)')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false });

      setExpenses((expenseData || []) as ActivityExpense[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('expenses').delete().eq('id', deleteId);
    if (error) {
      showToast('Could not delete expense.', 'error');
    } else {
      showToast('Expense deleted');
      setExpenses((prev) => prev.filter((e) => e.id !== deleteId));
    }
    setDeleteId(null);
  };

  const filtered = expenses.filter((e) => {
    const myShare = e.participants?.find((p) => p.user_id === user?.id)?.share_amount || 0;
    switch (filter) {
      case 'you_paid': return e.paid_by === user?.id;
      case 'others_paid': return e.paid_by !== user?.id;
      case 'you_owe': return e.paid_by !== user?.id && myShare > 0;
      case 'you_are_owed': return e.paid_by === user?.id && (Number(e.amount) - myShare) > 0.01;
      default: return true;
    }
  });

  if (loading) return <LoadingState text="Loading activity..." />;

  const currency = profile?.currency || 'INR';
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'you_paid', label: 'You Paid' },
    { key: 'others_paid', label: 'Others Paid' },
    { key: 'you_owe', label: 'You Owe' },
    { key: 'you_are_owed', label: 'Owed to You' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <h1 className="text-xl font-bold text-brown-900">Activity</h1>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key ? 'bg-brown-600 text-cream-50' : 'bg-white text-brown-500 border border-cream-200'
            }`}
          >
            {f.key === 'all' && <Filter className="w-3.5 h-3.5" />}
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt className="w-7 h-7" />}
            title="No expenses yet"
            description="When you or your group members add expenses, they'll appear here."
            action={undefined}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <div key={e.id} onClick={() => navigate(`/groups/${e.group_id}`)} className="cursor-pointer">
              <div className="mb-1 ml-1 text-xs text-brown-400">{e.group?.name}</div>
              <ExpenseCard
                expense={e as any}
                currentUserId={user!.id}
                currency={currency}
                onDelete={() => setDeleteId(e.id)}
              />
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense?"
        confirmText="Delete"
        danger
      />
    </div>
  );
}
