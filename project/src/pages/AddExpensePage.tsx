import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Check, AlertCircle, Wand2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { parseExpenseText, resolveParticipants, resolvePayer } from '@/lib/aiParser';
import { calculateSplit, validateSplit } from '@/lib/splitEngine';
import { EXPENSE_CATEGORIES, ExpenseCategory, SplitType, SplitShare, Profile, Group } from '@/lib/types';
import { formatCurrency, roundTo2 } from '@/lib/format';

export function AddExpensePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [groupId, setGroupId] = useState(id || '');
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<{ user_id: string; profile?: Profile }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // AI input
  const [aiText, setAiText] = useState('');
  const [aiParsed, setAiParsed] = useState(false);

  // Form fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(user?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  // Load available groups (for standalone route without group ID)
  useEffect(() => {
    if (id) {
      setGroupId(id);
      return;
    }
    // No group ID in URL — load user's groups for selection
    if (user) {
      supabase
        .from('group_members')
        .select('group:groups(*)')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            console.error(error);
            setLoading(false);
            return;
          }
          const groups = (data || []).map((m: any) => m.group as Group).filter(Boolean);
          setAvailableGroups(groups);
          if (groups.length > 0) {
            setGroupId(groups[0].id);
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [id, user]);

  // Load members when groupId changes
  useEffect(() => {
    if (groupId && user) {
      loadMembers(groupId);
    }
  }, [groupId, user]);

  // Auto-select all members when they first load
  useEffect(() => {
    if (members.length > 0 && selectedMembers.length === 0) {
      setSelectedMembers(members.map((m) => m.user_id));
    }
  }, [members]);

  const loadMembers = async (gid: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, profile:profiles(*)')
        .eq('group_id', gid);

      if (error) throw error;
      setMembers((data || []) as any);
      setPayerId(user!.id);
      // Reset selected members when group changes
      setSelectedMembers((data || []).map((m: any) => m.user_id));
    } catch (err) {
      console.error(err);
      showToast('Could not load group members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = (newGroupId: string) => {
    setGroupId(newGroupId);
    // Clear form state
    setDescription('');
    setAmount('');
    setAiText('');
    setAiParsed(false);
    setCustomShares({});
    setSplitType('equal');
    setCategory('other');
  };

  const handleAIParse = () => {
    if (!aiText.trim()) return;
    const parsed = parseExpenseText(aiText);

    if (parsed.amount) setAmount(String(parsed.amount));
    if (parsed.description) setDescription(parsed.description);
    if (parsed.category) setCategory(parsed.category);

    if (parsed.payerName) {
      const resolvedPayer = resolvePayer(parsed.payerName, members as any, user!.id);
      setPayerId(resolvedPayer);
    }

    if (parsed.participantNames.length > 0 && !parsed.participantNames.includes('__all__')) {
      const resolved = resolveParticipants(parsed.participantNames, members as any, user!.id);
      if (resolved.length > 0) {
        setSelectedMembers(resolved);
      }
    } else if (parsed.participantNames.includes('__all__')) {
      setSelectedMembers(members.map((m) => m.user_id));
    }

    if (parsed.needsClarification && parsed.clarificationQuestion) {
      showToast(parsed.clarificationQuestion, 'info');
    } else {
      showToast('AI understood your expense! Please review and confirm.', 'success');
    }

    setAiParsed(true);
  };

  const toggleMember = (uid: string) => {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  };

  const numericAmount = parseFloat(amount) || 0;
  const customSharesNumeric = splitType !== 'equal'
    ? Object.fromEntries(Object.entries(customShares).map(([k, v]) => [k, parseFloat(v) || 0]))
    : undefined;

  const shares = calculateSplit(numericAmount, selectedMembers, splitType, customSharesNumeric);
  const validation = validateSplit(numericAmount, splitType, selectedMembers, customSharesNumeric);

  const customTotal = splitType !== 'equal'
    ? selectedMembers.reduce((sum, uid) => sum + (parseFloat(customShares[uid] || '0') || 0), 0)
    : 0;

  const handleSave = async () => {
    if (!groupId || !user || !description.trim() || numericAmount <= 0) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    if (!validation.valid) {
      showToast(validation.error || 'Invalid split.', 'error');
      return;
    }

    setSaving(true);
    try {
      const { data: expense, error: expError } = await supabase
        .from('expenses')
        .insert({
          group_id: groupId,
          description: description.trim(),
          amount: numericAmount,
          paid_by: payerId,
          category,
          split_type: splitType,
          expense_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (expError) throw expError;

      const participantRows = shares.map((s: SplitShare) => ({
        expense_id: expense.id,
        user_id: s.userId,
        share_amount: s.shareAmount,
        percentage: s.percentage,
      }));

      const { error: pError } = await supabase.from('expense_participants').insert(participantRows);
      if (pError) throw pError;

      // Send notifications to other participants (fire and forget)
      const otherUserIds = selectedMembers.filter((uid) => uid !== user.id);
      if (otherUserIds.length > 0) {
        const notifications = otherUserIds.map((uid) => ({
          user_id: uid,
          type: 'new_expense',
          title: 'New Expense Added',
          message: `${profile?.name || 'Someone'} added "${description.trim()}" - your share is ${formatCurrency(shares.find((s) => s.userId === uid)?.shareAmount || 0, profile?.currency || 'INR')}`,
          group_id: groupId,
        }));
        await supabase.from('notifications').insert(notifications);
      }

      showToast('Expense added successfully!');
      navigate(`/groups/${groupId}`);
    } catch (err) {
      showToast('Could not save expense. Please try again.', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState text="Loading..." />;

  const currency = profile?.currency || 'INR';

  // No group selected and no groups available
  if (!groupId && availableGroups.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-brown-500 hover:bg-cream-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-brown-900">Add Expense</h1>
        </div>
        <Card>
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="No groups available"
            description="You need to be in a group before you can add expenses. Create or join a group first."
            action={<Button onClick={() => navigate('/groups')}>Go to Groups</Button>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-brown-500 hover:bg-cream-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-brown-900">Add Expense</h1>
      </div>

      {/* Group selector (only on standalone route) */}
      {!id && availableGroups.length > 0 && (
        <Card className="p-5">
          <Select label="Select Group" value={groupId} onChange={(e) => handleGroupChange(e.target.value)}>
            {availableGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </Card>
      )}

      {/* AI Input */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-brown-100 flex items-center justify-center text-brown-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brown-800">AI Expense Entry</h3>
            <p className="text-xs text-brown-400">Describe your expense in natural language</p>
          </div>
        </div>
        <Textarea
          placeholder="e.g. I paid ₹1200 for dinner for everyone"
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          rows={2}
        />
        <Button className="w-full mt-3" variant="secondary" onClick={handleAIParse} disabled={!aiText.trim()}>
          <Wand2 className="w-4 h-4" /> Parse with AI
        </Button>

        {aiParsed && (
          <div className="mt-3 bg-cream-100 rounded-xl p-3 animate-fade-in">
            <div className="flex items-center gap-1.5 text-xs text-brown-500 mb-1">
              <Check className="w-3.5 h-3.5 text-success-500" />
              AI understood your expense — review below
            </div>
            <p className="text-sm text-brown-700">
              {description || 'Expense'} · {amount ? formatCurrency(numericAmount, currency) : '—'} · Paid by {members.find((m) => m.user_id === payerId)?.profile?.name || 'You'} · Split between {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </Card>

      {/* Manual Form */}
      <Card className="p-5 space-y-4">
        <Input
          label="Description"
          placeholder="e.g. Dinner at restaurant"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </div>
        <Select label="Paid by" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.profile?.name || 'Unknown'}{m.user_id === user?.id ? ' (You)' : ''}
            </option>
          ))}
        </Select>
      </Card>

      {/* Split Options */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-brown-800 mb-3">Split with</h3>

        <div className="flex gap-1 bg-cream-200 rounded-xl p-1 mb-4">
          {([
            { key: 'equal' as SplitType, label: 'Equal' },
            { key: 'exact' as SplitType, label: 'Exact' },
            { key: 'percentage' as SplitType, label: 'Percentage' },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSplitType(opt.key)}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${splitType === opt.key ? 'bg-white text-brown-800 shadow-sm' : 'text-brown-500'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Member selection */}
        <div className="space-y-2 mb-4">
          {members.map((m) => {
            const selected = selectedMembers.includes(m.user_id);
            const share = shares.find((s) => s.userId === m.user_id);
            return (
              <div key={m.user_id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selected ? 'border-brown-300 bg-cream-50' : 'border-cream-200 bg-white'}`}>
                <button
                  onClick={() => toggleMember(m.user_id)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected ? 'border-brown-600 bg-brown-600' : 'border-cream-300'}`}
                >
                  {selected && <Check className="w-3 h-3 text-cream-50" />}
                </button>
                {m.profile && <Avatar name={m.profile.name} id={m.user_id} size="sm" src={m.profile.avatar_url} />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brown-800 truncate">
                    {m.profile?.name || 'Unknown'}{m.user_id === user?.id ? ' (You)' : ''}
                  </p>
                </div>
                {selected && splitType !== 'equal' && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="0"
                      value={customShares[m.user_id] || ''}
                      onChange={(e) => setCustomShares({ ...customShares, [m.user_id]: e.target.value })}
                      className="w-20 text-sm py-1.5"
                    />
                    <span className="text-xs text-brown-400">{splitType === 'percentage' ? '%' : currency}</span>
                  </div>
                )}
                {selected && splitType === 'equal' && share && (
                  <span className="text-sm font-semibold text-brown-700 tabular-nums">{formatCurrency(share.shareAmount, currency)}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Validation for custom splits */}
        {splitType !== 'equal' && selectedMembers.length > 0 && (
          <div className="text-xs text-brown-500 bg-cream-100 rounded-lg px-3 py-2 mb-3">
            {splitType === 'exact' && (
              <>Total: {formatCurrency(roundTo2(customTotal), currency)} / {formatCurrency(numericAmount, currency)} {Math.abs(roundTo2(customTotal) - numericAmount) < 0.01 ? <Check className="inline w-3.5 h-3.5 text-success-500" /> : <AlertCircle className="inline w-3.5 h-3.5 text-warning-500" />}</>
            )}
            {splitType === 'percentage' && (
              <>Total: {roundTo2(customTotal)}% {Math.abs(roundTo2(customTotal) - 100) < 0.01 ? <Check className="inline w-3.5 h-3.5 text-success-500" /> : <AlertCircle className="inline w-3.5 h-3.5 text-warning-500" />}</>
            )}
          </div>
        )}

        {validation.error && (
          <div className="flex items-center gap-2 text-xs text-danger-600 bg-danger-50 rounded-lg px-3 py-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5" />
            {validation.error}
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>Cancel</Button>
        <Button className="flex-1" loading={saving} disabled={!description.trim() || numericAmount <= 0 || !groupId} onClick={handleSave}>
          <Check className="w-4 h-4" /> Confirm Expense
        </Button>
      </div>
    </div>
  );
}
