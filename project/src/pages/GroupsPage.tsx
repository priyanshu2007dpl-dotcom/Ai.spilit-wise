import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GroupCard } from '@/components/feature/GroupCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Group, Expense } from '@/lib/types';
import { calculateBalances } from '@/lib/balanceEngine';

interface GroupWithStats extends Group {
  memberCount: number;
  totalExpenses: number;
  balance: number;
  lastActivity?: string;
}

export function GroupsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupWithStats[]>([]);

  useEffect(() => {
    if (user) loadGroups();
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group:groups(*)')
        .eq('user_id', user.id);

      const userGroups = (memberData || []).map((m: any) => m.group as Group).filter(Boolean);

      const groupStats: GroupWithStats[] = [];

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
      }

      setGroups(groupStats);
    } catch (err) {
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState text="Loading your groups..." />;

  const currency = profile?.currency || 'INR';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brown-900">Your Groups</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/groups/join')}>
            <LogIn className="w-4 h-4" /> Join
          </Button>
          <Button size="sm" onClick={() => navigate('/groups/new')}>
            <Plus className="w-4 h-4" /> Create
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="No groups yet"
            description="Create a group for your trip, flat, or outing — or join one with an invite code."
            action={
              <div className="flex gap-2">
                <Button onClick={() => navigate('/groups/new')}>Create Group</Button>
                <Button variant="outline" onClick={() => navigate('/groups/join')}>Join Group</Button>
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
  );
}
