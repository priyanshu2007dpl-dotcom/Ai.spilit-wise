import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Receipt, Split } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BalanceCard } from '@/components/feature/BalanceCard';
import { GroupCard } from '@/components/feature/GroupCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { seedDemoData } from '@/lib/demoData';
import { Group, Expense } from '@/lib/types';
import { calculateBalances, getNetBalanceSummary } from '@/lib/balanceEngine';
import { formatCurrency, formatRelativeTime } from '@/lib/format';

interface GroupWithStats extends Group {
  memberCount: number;
  totalExpenses: number;
  balance: number;
  lastActivity?: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [groups, setGroups] = useState<GroupWithStats[]>([]);
  const [summary, setSummary] = useState({ totalPaid: 0, owes: 0, owed: 0, net: 0 });
  const [recentActivity, setRecentActivity] = useState<{ id: string; description: string; amount: number; group_name: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group:groups(*)')
        .eq('user_id', user.id);

      const userGroups = (memberData || []).map((m: any) => m.group as Group).filter(Boolean);
      const groupIds = userGroups.map((g) => g.id);

      if (groupIds.length === 0) {
        setLoading(false);
        return;
      }

      const groupStats: GroupWithStats[] = [];
      let allBalances: { userId: string; paid: number; share: number; net: number }[] = [];

      for (const group of userGroups) {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', group.id);

        const { data: expenses } = await supabase
          .from('expenses')
          .select('*, participants:expense_participants(user_id, share_amount)')
          .eq('group_id', group.id)
          .order('created_at', { ascending: false });

        const balances = calculateBalances(members || [], expenses || []);
        const myBalance = balances.find((b) => b.userId === user.id)?.net || 0;
        const totalExpenses = (expenses || []).reduce((sum: number, e: Expense) => sum + Number(e.amount), 0);

        groupStats.push({
          ...group,
          memberCount: members?.length || 0,
          totalExpenses,
          balance: myBalance,
          lastActivity: expenses?.[0]?.created_at,
        });

        const myBal = balances.find((b) => b.userId === user.id);
        if (myBal) allBalances.push(myBal);
      }

      setGroups(groupStats);
      const result = getNetBalanceSummary(allBalances);
      setSummary({ totalPaid: result.totalPaid, owes: result.owes, owed: result.owed, net: result.net });

      const { data: recentExpenses } = await supabase
        .from('expenses')
        .select('id, description, amount, created_at, group:groups(name)')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity((recentExpenses || []).map((e: any) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        group_name: e.group?.name || '',
        created_at: e.created_at,
      })));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    if (!user || !profile) return;
    setSeeding(true);
    try {
      await seedDemoData(user.id, profile.name);
      showToast('Demo data created! Check out the Goa Trip group.');
      loadDashboard();
    } catch {
      showToast('Could not create demo data.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <LoadingState text="Loading your dashboard..." />;

  const currency = profile?.currency || 'INR';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-brown-400">Welcome back,</p>
          <h1 className="text-xl font-bold text-brown-900">{profile?.name || 'User'}</h1>
        </div>
        <Button size="sm" onClick={() => navigate('/groups/new')}>
          <Plus className="w-4 h-4" /> Create Group
        </Button>
      </div>

      {/* Balance Summary */}
      <BalanceCard
        totalPaid={summary.totalPaid}
        youOwe={summary.owes}
        youAreOwed={summary.owed}
        netBalance={summary.net}
        currency={currency}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="w-9 h-9 rounded-lg bg-cream-200 flex items-center justify-center text-brown-600 mx-auto mb-2">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-brown-900">{groups.length}</p>
          <p className="text-xs text-brown-400">Groups</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-9 h-9 rounded-lg bg-cream-200 flex items-center justify-center text-brown-600 mx-auto mb-2">
            <Receipt className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-brown-900">{formatCurrency(summary.totalPaid, currency)}</p>
          <p className="text-xs text-brown-400">You Paid</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-9 h-9 rounded-lg bg-cream-200 flex items-center justify-center text-brown-600 mx-auto mb-2">
            <Split className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-brown-900">{formatCurrency(summary.owed - summary.owes, currency)}</p>
          <p className="text-xs text-brown-400">Net</p>
        </Card>
      </div>

      {/* Your Groups */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-brown-900">Your Groups</h2>
          {groups.length > 0 && (
            <button onClick={() => navigate('/groups')} className="text-sm text-brown-500 hover:text-brown-700">
              View all
            </button>
          )}
        </div>

        {groups.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users className="w-7 h-7" />}
              title="You haven't created a group yet"
              description="Create your first group and start splitting expenses with friends."
              action={
                <div className="flex flex-col gap-2">
                  <Button onClick={() => navigate('/groups/new')}>Create Your First Group</Button>
                  <Button variant="outline" loading={seeding} onClick={handleSeedDemo}>
                    Try with Demo Data
                  </Button>
                </div>
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                memberCount={group.memberCount}
                totalExpenses={group.totalExpenses}
                balance={group.balance}
                currency={currency}
                lastActivity={group.lastActivity}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-brown-900 mb-3">Recent Activity</h2>
          <Card className="divide-y divide-cream-100">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brown-800 truncate">{activity.description}</p>
                  <p className="text-xs text-brown-400">{activity.group_name} · {formatRelativeTime(activity.created_at)}</p>
                </div>
                <span className="text-sm font-semibold text-brown-900 tabular-nums flex-shrink-0 ml-3">
                  {formatCurrency(activity.amount, currency)}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
