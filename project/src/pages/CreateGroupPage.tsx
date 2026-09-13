import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plane, Home, Heart, Briefcase, Folder, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { generateInviteCode } from '@/lib/format';
import { GROUP_CATEGORIES, GroupCategory } from '@/lib/types';
import { LucideIcon } from 'lucide-react';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const categoryIcons: Record<string, LucideIcon> = {
  trip: Plane, friends: Users, roommates: Home, family: Heart, office: Briefcase, other: Folder,
};

export function CreateGroupPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GroupCategory>('trip');
  const [memberName, setMemberName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addMember = () => {
    const trimmed = memberName.trim();
    if (trimmed && !members.includes(trimmed)) {
      setMembers([...members, trimmed]);
      setMemberName('');
    }
  };

  const removeMember = (m: string) => setMembers(members.filter((x) => x !== m));

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setLoading(true);

    try {
      const inviteCode = generateInviteCode();
      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          category,
          invite_code: inviteCode,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add yourself as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      // Add named members: create a profile + group_member for each
      if (members.length > 0) {
        const memberRows: { group_id: string; user_id: string; role: string }[] = [];
        const profileRows: { id: string; name: string }[] = [];

        for (const memberName of members) {
          const profileId = generateUUID();
          profileRows.push({ id: profileId, name: memberName });
          memberRows.push({ group_id: group.id, user_id: profileId, role: 'member' });
        }

        const { error: profileErr } = await supabase.from('profiles').insert(profileRows);
        if (profileErr) throw profileErr;

        const { error: membersErr } = await supabase.from('group_members').insert(memberRows);
        if (membersErr) throw membersErr;
      }

      showToast('Group created successfully!');
      navigate(`/groups/${group.id}`);
    } catch (err) {
      console.error('Group creation error:', err);
      showToast('Could not create group. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/groups')} className="p-2 rounded-lg text-brown-500 hover:bg-cream-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-brown-900">Create Group</h1>
      </div>

      <Card className="p-5 space-y-4">
        <Input
          label="Group Name"
          placeholder="e.g. Goa Trip"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Textarea
          label="Description (optional)"
          placeholder="What's this group for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <div>
          <label className="block text-sm font-medium text-brown-700 mb-1.5">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {GROUP_CATEGORIES.map((cat) => {
              const Icon = categoryIcons[cat.icon] || Folder;
              const selected = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value as GroupCategory)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                    selected
                      ? 'border-brown-500 bg-brown-100 text-brown-800'
                      : 'border-cream-300 bg-cream-50 text-brown-500 hover:border-brown-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-brown-800 mb-3">Add Members</h3>
        <p className="text-xs text-brown-400 mb-3">
          You can add members by name now — they'll join when they sign up. Or share the invite code after creating the group.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Member name"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMember(); } }}
          />
          <Button variant="secondary" onClick={addMember}>Add</Button>
        </div>

        {members.length > 0 && (
          <div className="mt-3 space-y-2">
            {members.map((m) => (
              <div key={m} className="flex items-center justify-between bg-cream-100 rounded-lg px-3 py-2">
                <span className="text-sm text-brown-700">{m}</span>
                <button onClick={() => removeMember(m)} className="text-xs text-danger-600 hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm text-brown-500 bg-cream-100 rounded-lg px-3 py-2">
          <Check className="w-4 h-4 text-success-500" />
          You'll be the group admin. You can add more members later.
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/groups')}>Cancel</Button>
        <Button className="flex-1" loading={loading} disabled={!name.trim()} onClick={handleCreate}>
          Create Group
        </Button>
      </div>
    </div>
  );
}
