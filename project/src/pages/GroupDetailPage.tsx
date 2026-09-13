import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Receipt, Scale, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { MemberCard } from '@/components/feature/MemberCard';
import { ExpenseCard } from '@/components/feature/ExpenseCard';
import { SettlementCard } from '@/components/feature/SettlementCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { useGroupData } from '@/hooks/useGroupData';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { SettlementStatus } from '@/lib/types';

type Tab = 'overview' | 'expenses' | 'members' | 'settle';

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const { group, members, expenses, settlements, balances, settlementsPlan, loading, error, refresh } = useGroupData(id);
  const [tab, setTab] = useState<Tab>('overview');
  const [showInvite, setShowInvite] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [settleModal, setSettleModal] = useState<{ fromUserId: string; toUserId: string; amount: number } | null>(null);

  if (loading) return <LoadingState text="Loading group..." />;
  if (error || !group) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <EmptyState icon={<Receipt className="w-7 h-7" />} title="Group not found" description={error || 'This group may have been deleted.'} action={<Button onClick={() => navigate('/groups')}>Back to Groups</Button>} />
      </div>
    );
  }

  const currency = profile?.currency || 'INR';
  const myBalance = balances.find((b) => b.userId === user?.id);
  const isAdmin = members.find((m) => m.user_id === user?.id)?.role === 'admin';
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.invite_code);
    showToast('Invite code copied!');
  };

  const shareGroup = async () => {
    const text = `Join my group "${group.name}" on SplitWise AI! Use code: ${group.invite_code}`;
    if (navigator.share) {
      try { await navigator.share({ title: group.name, text }); } catch {}
    } else {
      navigator.clipboard.writeText(text);
      showToast('Invite text copied!');
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    const { error } = await supabase.from('expenses').delete().eq('id', deleteExpenseId);
    if (error) {
      showToast('Could not delete expense.', 'error');
    } else {
      showToast('Expense deleted');
      refresh();
    }
    setDeleteExpenseId(null);
  };

  const handleSettleAction = async (action: 'pay' | 'confirm' | 'dispute', settlementId: string) => {
    const updates: Record<string, { status: SettlementStatus; confirmed_at?: string }> = {
      pay: { status: 'paid' },
      confirm: { status: 'confirmed', confirmed_at: new Date().toISOString() },
      dispute: { status: 'disputed' },
    };
    const { error } = await supabase.from('settlements').update(updates[action]).eq('id', settlementId);
    if (error) {
      showToast('Could not update payment status.', 'error');
    } else {
      showToast(action === 'pay' ? 'Marked as paid' : action === 'confirm' ? 'Payment confirmed!' : 'Payment disputed');
      refresh();
    }
  };

  const createSettlement = async (fromUserId: string, toUserId: string, amount: number) => {
    const { error } = await supabase.from('settlements').insert({
      group_id: group.id,
      from_user: fromUserId,
      to_user: toUserId,
      amount,
      status: 'pending',
    });
    if (error) {
      showToast('Could not create settlement.', 'error');
    } else {
      showToast('Settlement created');
      refresh();
    }
    setSettleModal(null);
  };

  const memberById = (uid: string) => members.find((m) => m.user_id === uid);
  const profileById = (uid: string) => memberById(uid)?.profile;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/groups')} className="p-2 rounded-lg text-brown-500 hover:bg-cream-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-brown-900 truncate">{group.name}</h1>
          <p className="text-xs text-brown-400">{members.length} members · {formatCurrency(totalExpenses, currency)} total</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="p-2 rounded-lg text-brown-500 hover:bg-cream-200">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Balance Summary */}
      <Card className="p-5 bg-gradient-to-br from-brown-600 to-brown-800 text-cream-50 border-0">
        <p className="text-sm text-cream-300 mb-1">Your balance</p>
        {myBalance && (
          <>
            <p className={`text-2xl font-bold tabular-nums ${myBalance.net > 0.01 ? 'text-success-500' : myBalance.net < -0.01 ? 'text-danger-500' : 'text-cream-100'}`}>
              {myBalance.net > 0.01 ? '+' : myBalance.net < -0.01 ? '-' : ''}{formatCurrency(Math.abs(myBalance.net), currency)}
            </p>
            <p className="text-xs text-cream-300 mt-1">
              {myBalance.net > 0.01 ? 'You are owed money' : myBalance.net < -0.01 ? 'You owe money' : 'You are all settled'}
            </p>
          </>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-200 rounded-xl p-1">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'expenses', label: 'Expenses' },
          { key: 'members', label: 'Members' },
          { key: 'settle', label: 'Settle Up' },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${tab === t.key ? 'bg-white text-brown-800 shadow-sm' : 'text-brown-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-brown-400" />
                <p className="text-xs text-brown-400">Members</p>
              </div>
              <p className="text-xl font-bold text-brown-900">{members.length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-brown-400" />
                <p className="text-xs text-brown-400">Total Expenses</p>
              </div>
              <p className="text-xl font-bold text-brown-900">{formatCurrency(totalExpenses, currency)}</p>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-brown-800">Recent Expenses</h3>
              {expenses.length > 0 && (
                <button onClick={() => setTab('expenses')} className="text-xs text-brown-500 hover:text-brown-700">View all</button>
              )}
            </div>
            {expenses.length === 0 ? (
              <Card><EmptyState icon={<Receipt className="w-7 h-7" />} title="No expenses yet" description="Add your first expense and let AI handle the split." action={<Button size="sm" onClick={() => navigate(`/groups/${group.id}/add-expense`)}><Plus className="w-4 h-4" /> Add Expense</Button>} /></Card>
            ) : (
              <div className="space-y-2">
                {expenses.slice(0, 3).map((e) => (
                  <ExpenseCard key={e.id} expense={e as any} currentUserId={user!.id} currency={currency} onDelete={() => setDeleteExpenseId(e.id)} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-brown-800 mb-2">Balances</h3>
            <div className="space-y-2">
              {balances.map((b) => {
                const m = memberById(b.userId);
                if (!m) return null;
                return <MemberCard key={b.userId} member={m as any} paid={b.paid} owes={b.share} net={b.net} currency={currency} onClick={() => navigate(`/groups/${group.id}/members/${b.userId}`)} />;
              })}
            </div>
          </div>

          <Button className="w-full" onClick={() => navigate(`/groups/${group.id}/add-expense`)}>
            <Plus className="w-4 h-4" /> Add Expense
          </Button>
        </div>
      )}

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <div className="space-y-3">
          <Button className="w-full" onClick={() => navigate(`/groups/${group.id}/add-expense`)}>
            <Plus className="w-4 h-4" /> Add Expense
          </Button>
          {expenses.length === 0 ? (
            <Card><EmptyState icon={<Receipt className="w-7 h-7" />} title="No expenses yet" description="Add your first expense and let AI handle the split." /></Card>
          ) : (
            expenses.map((e) => (
              <ExpenseCard key={e.id} expense={e as any} currentUserId={user!.id} currency={currency} onDelete={() => setDeleteExpenseId(e.id)} />
            ))
          )}
        </div>
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="space-y-3">
          {balances.map((b) => {
            const m = memberById(b.userId);
            if (!m) return null;
            return <MemberCard key={b.userId} member={m as any} paid={b.paid} owes={b.share} net={b.net} currency={currency} onClick={() => navigate(`/groups/${group.id}/members/${b.userId}`)} />;
          })}
          <Button variant="outline" className="w-full" onClick={() => setShowInvite(true)}>
            <Share2 className="w-4 h-4" /> Invite Members
          </Button>
        </div>
      )}

      {/* Settle Tab */}
      {tab === 'settle' && (
        <div className="space-y-4">
          {/* Existing settlements */}
          {settlements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-brown-800 mb-2">Payment History</h3>
              <div className="space-y-2">
                {settlements.map((s) => (
                  <SettlementCard
                    key={s.id}
                    settlement={s as any}
                    currentUserId={user!.id}
                    currency={currency}
                    onAction={(action) => handleSettleAction(action, s.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Settlement Plan */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-brown-600" />
              <h3 className="text-sm font-semibold text-brown-800">Settlement Plan</h3>
            </div>

            {settlementsPlan.length === 0 ? (
              <Card><EmptyState icon={<Scale className="w-7 h-7" />} title="Everyone is settled" description="All balances are zero. No payments needed." /></Card>
            ) : (
              <>
                <p className="text-xs text-brown-400 mb-2">{settlementsPlan.length} transactions to settle all balances</p>
                <div className="space-y-2">
                  {settlementsPlan.map((t, i) => {
                    const fromP = profileById(t.fromUserId);
                    const toP = profileById(t.toUserId);
                    const isSender = t.fromUserId === user?.id;
                    const isReceiver = t.toUserId === user?.id;
                    return (
                      <Card key={i} className="p-4">
                        <div className="flex items-center gap-3">
                          {fromP && <Avatar name={fromP.name} id={t.fromUserId} size="sm" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brown-800 truncate">
                              {isSender ? 'You' : fromP?.name} pays {isReceiver ? 'you' : toP?.name}
                            </p>
                            <p className="text-lg font-semibold text-brown-900 tabular-nums">{formatCurrency(t.amount, currency)}</p>
                          </div>
                          {(isSender || isReceiver) && (
                            <Button size="sm" onClick={() => setSettleModal({ fromUserId: t.fromUserId, toUserId: t.toUserId, amount: t.amount })}>
                              Settle
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Members">
        <div className="text-center">
          <p className="text-sm text-brown-500 mb-4">Share this code with friends so they can join the group.</p>
          <div className="bg-cream-100 rounded-xl py-4 mb-4">
            <p className="text-2xl font-bold text-brown-900 tracking-widest">{group.invite_code}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={copyInviteCode}>
              <Copy className="w-4 h-4" /> Copy Code
            </Button>
            <Button className="flex-1" onClick={shareGroup}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Expense Modal */}
      <ConfirmModal
        open={!!deleteExpenseId}
        onClose={() => setDeleteExpenseId(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        danger
      />

      {/* Settle Confirm Modal */}
      <ConfirmModal
        open={!!settleModal}
        onClose={() => setSettleModal(null)}
        onConfirm={() => settleModal && createSettlement(settleModal.fromUserId, settleModal.toUserId, settleModal.amount)}
        title="Create Settlement"
        message={`Create a ${formatCurrency(settleModal?.amount || 0, currency)} payment record? You can mark it as paid after.`}
        confirmText="Create"
      />
    </div>
  );
}
