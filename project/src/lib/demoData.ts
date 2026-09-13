import { supabase } from './supabase';
import { calculateSplit } from './splitEngine';
import { generateInviteCode } from './format';
import { SplitType, ExpenseCategory } from './types';

/**
 * Creates a demo group with sample members and expenses for the current user.
 * This makes the app feel alive immediately without manual data entry.
 */
export async function seedDemoData(userId: string, userName: string): Promise<void> {
  const inviteCode = generateInviteCode();

  // Create demo group
  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .insert({
      name: 'Goa Trip',
      description: 'Weekend trip to Goa with friends',
      category: 'trip',
      invite_code: inviteCode,
      created_by: userId,
    })
    .select()
    .single();

  if (groupErr || !group) throw new Error('Could not create demo group');

  // Add current user as admin
  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: userId,
    role: 'admin',
  });

  // Create demo member profiles (standalone, not linked to auth)
  const demoMembers = [
    { name: 'Rahul', email: 'rahul@demo.com' },
    { name: 'Priya', email: 'priya@demo.com' },
    { name: 'Aman', email: 'aman@demo.com' },
  ];

  const memberIds: string[] = [userId];
  const memberNames: Record<string, string> = { [userId]: userName };

  for (const dm of demoMembers) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        name: dm.name,
        email: dm.email,
        upi_id: `${dm.name.toLowerCase()}@upi`,
      })
      .select()
      .single();

    if (!error && profile) {
      memberIds.push(profile.id);
      memberNames[profile.id] = dm.name;
      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: profile.id,
        role: 'member',
      });
    }
  }

  // Create demo expenses
  const expenses = [
    { description: 'Dinner', amount: 2400, paidBy: 'Rahul', category: 'food' as ExpenseCategory, participants: 'all' },
    { description: 'Hotel', amount: 8000, paidBy: 'You', category: 'hotel' as ExpenseCategory, participants: 'all' },
    { description: 'Taxi', amount: 1200, paidBy: 'Rahul', category: 'transport' as ExpenseCategory, participants: 'all' },
    { description: 'Tickets', amount: 3600, paidBy: 'Priya', category: 'tickets' as ExpenseCategory, participants: 'all' },
    { description: 'Lunch', amount: 600, paidBy: 'Priya', category: 'food' as ExpenseCategory, participants: 'me_rahul' },
  ];

  for (const exp of expenses) {
    const payerId = exp.paidBy === 'You' ? userId : memberIds.find((id) => memberNames[id] === exp.paidBy) || userId;

    let participants: string[];
    if (exp.participants === 'all') {
      participants = memberIds;
    } else if (exp.participants === 'me_rahul') {
      const rahulId = memberIds.find((id) => memberNames[id] === 'Rahul');
      participants = rahulId ? [userId, rahulId] : [userId];
    } else {
      participants = memberIds;
    }

    const { data: expense, error: eErr } = await supabase
      .from('expenses')
      .insert({
        group_id: group.id,
        description: exp.description,
        amount: exp.amount,
        paid_by: payerId,
        category: exp.category,
        split_type: 'equal' as SplitType,
        expense_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (eErr || !expense) continue;

    const shares = calculateSplit(exp.amount, participants, 'equal');
    const rows = shares.map((s) => ({
      expense_id: expense.id,
      user_id: s.userId,
      share_amount: s.shareAmount,
      percentage: s.percentage,
    }));

    await supabase.from('expense_participants').insert(rows);
  }

  // Create a notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'added_to_group',
    title: 'Welcome to SplitWise AI!',
    message: 'A demo "Goa Trip" group has been created with sample expenses. Explore the app to see how it works.',
    group_id: group.id,
  });
}
