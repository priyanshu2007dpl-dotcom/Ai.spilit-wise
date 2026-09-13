import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';

export function JoinGroupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!user || !code.trim()) return;
    setLoading(true);

    try {
      const { data: group, error } = await supabase
        .from('groups')
        .select('id, name')
        .eq('invite_code', code.trim().toUpperCase())
        .maybeSingle();

      if (error || !group) {
        showToast('Group not found. Check the code and try again.', 'error');
        setLoading(false);
        return;
      }

      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        showToast("You're already a member of this group!", 'info');
        navigate(`/groups/${group.id}`);
        return;
      }

      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) throw joinError;

      showToast(`Joined ${group.name}!`);
      navigate(`/groups/${group.id}`);
    } catch (err) {
      showToast('Something went wrong. Please try again.', 'error');
      console.error(err);
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
        <h1 className="text-xl font-bold text-brown-900">Join Group</h1>
      </div>

      <Card className="p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brown-100 flex items-center justify-center text-brown-600 mx-auto mb-4">
          <LogIn className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-semibold text-brown-900 mb-1">Enter Group Code</h2>
        <p className="text-sm text-brown-500 mb-5">
          Ask the group creator for the 6-character invite code.
        </p>
        <Input
          placeholder="e.g. GOA2026"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter' && code.trim()) handleJoin(); }}
          className="text-center text-lg font-semibold tracking-widest uppercase"
          maxLength={6}
        />
        <Button className="w-full mt-4" loading={loading} disabled={!code.trim()} onClick={handleJoin}>
          Join Group
        </Button>
      </Card>
    </div>
  );
}
