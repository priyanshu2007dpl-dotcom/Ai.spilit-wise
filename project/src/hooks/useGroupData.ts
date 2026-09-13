import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  Group, GroupMember, Expense, ExpenseParticipant, Settlement, Profile,
} from '@/lib/types';
import { calculateBalances } from '@/lib/balanceEngine';
import { calculateSettlements } from '@/lib/settlementEngine';
import { MemberBalance, SettlementTransaction } from '@/lib/types';

interface GroupData {
  group: Group | null;
  members: (GroupMember & { profile?: Profile })[];
  expenses: (Expense & { payer?: Profile; participants?: ExpenseParticipant[] })[];
  settlements: (Settlement & { from_profile?: Profile; to_profile?: Profile })[];
  balances: MemberBalance[];
  settlementsPlan: SettlementTransaction[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useGroupData(groupId: string | undefined): GroupData {
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<(GroupMember & { profile?: Profile })[]>([]);
  const [expenses, setExpenses] = useState<(Expense & { payer?: Profile; participants?: ExpenseParticipant[] })[]>([]);
  const [settlements, setSettlements] = useState<(Settlement & { from_profile?: Profile; to_profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: groupData, error: groupErr } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .maybeSingle();

      if (groupErr) throw groupErr;
      if (!groupData) {
        setError('Group not found');
        setLoading(false);
        return;
      }
      setGroup(groupData as Group);

      const { data: memberData, error: memberErr } = await supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', groupId);

      if (memberErr) throw memberErr;
      setMembers((memberData || []) as (GroupMember & { profile?: Profile })[]);

      const { data: expenseData, error: expenseErr } = await supabase
        .from('expenses')
        .select('*, payer:profiles(*), participants:expense_participants(*, profile:profiles(*))')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (expenseErr) throw expenseErr;
      setExpenses((expenseData || []) as (Expense & { payer?: Profile; participants?: ExpenseParticipant[] })[]);

      const { data: settlementData, error: settlementErr } = await supabase
        .from('settlements')
        .select('*, from_profile:profiles!from_user(*), to_profile:profiles!to_user(*)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (settlementErr) throw settlementErr;
      setSettlements((settlementData || []) as (Settlement & { from_profile?: Profile; to_profile?: Profile })[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const balances = calculateBalances(members, expenses);
  const confirmedSettlements = settlements.filter((s) => s.status === 'confirmed');

  const adjustedBalances = balances.map((b) => {
    const confirmedPaid = confirmedSettlements
      .filter((s) => s.from_user === b.userId)
      .reduce((sum, s) => sum + s.amount, 0);
    const confirmedReceived = confirmedSettlements
      .filter((s) => s.to_user === b.userId)
      .reduce((sum, s) => sum + s.amount, 0);
    return {
      ...b,
      net: Math.round((b.net - confirmedReceived + confirmedPaid) * 100) / 100,
    };
  });

  const settlementsPlan = calculateSettlements(adjustedBalances);

  return {
    group,
    members,
    expenses,
    settlements,
    balances: adjustedBalances,
    settlementsPlan,
    loading,
    error,
    refresh: load,
  };
}
