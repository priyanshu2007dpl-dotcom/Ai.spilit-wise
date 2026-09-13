import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, QrCode, CreditCard, Share2, Receipt, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useGroupData } from '@/hooks/useGroupData';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/format';

export function MemberDetailPage() {
  const { id, memberId } = useParams<{ id: string; memberId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const { members, expenses, balances, settlements, loading } = useGroupData(id);

  if (loading) return <LoadingState text="Loading member..." />;

  const member = members.find((m) => m.user_id === memberId);
  const memberProfile = member?.profile;
  const balance = balances.find((b) => b.userId === memberId);

  if (!member || !memberProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <EmptyState icon={<Receipt className="w-7 h-7" />} title="Member not found" action={<Button onClick={() => navigate(`/groups/${id}`)}>Back to Group</Button>} />
      </div>
    );
  }

  const currency = profile?.currency || 'INR';
  const isMe = memberId === user?.id;

  // Expenses paid by this member
  const paidExpenses = expenses.filter((e) => e.paid_by === memberId);
  // Expenses this member is involved in
  const involvedExpenses = expenses.filter((e) => e.participants?.some((p) => p.user_id === memberId));
  // Settlements involving this member
  const memberSettlements = settlements.filter((s) => s.from_user === memberId || s.to_user === memberId);

  const shareQR = async () => {
    if (memberProfile.qr_code_data) {
      if (navigator.share) {
        try {
          const response = await fetch(memberProfile.qr_code_data);
          const blob = await response.blob();
          const file = new File([blob], `${memberProfile.name}-qr.png`, { type: 'image/png' });
          await navigator.share({ title: `${memberProfile.name}'s QR`, files: [file] });
        } catch {}
      } else {
        showToast('QR sharing not supported on this device.', 'info');
      }
    } else {
      showToast(`${memberProfile.name} hasn't added a QR code yet.`, 'info');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/groups/${id}`)} className="p-2 rounded-lg text-brown-500 hover:bg-cream-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-brown-900">Member Details</h1>
      </div>

      {/* Member header */}
      <Card className="p-5 flex items-center gap-4">
        <Avatar name={memberProfile.name} id={memberProfile.id} size="xl" src={memberProfile.avatar_url} />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-brown-900">{memberProfile.name}</h2>
          {member.role === 'admin' && <Badge variant="brown">Admin</Badge>}
          {isMe && <Badge variant="neutral">You</Badge>}
        </div>
      </Card>

      {/* Balance summary */}
      {balance && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <p className="text-xs text-brown-400 mb-1">Total Paid</p>
            <p className="text-base font-bold text-brown-900 tabular-nums">{formatCurrency(balance.paid, currency)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-brown-400 mb-1">Total Share</p>
            <p className="text-base font-bold text-brown-900 tabular-nums">{formatCurrency(balance.share, currency)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-brown-400 mb-1">Net Balance</p>
            <p className={`text-base font-bold tabular-nums ${balance.net > 0.01 ? 'text-success-600' : balance.net < -0.01 ? 'text-danger-600' : 'text-brown-500'}`}>
              {balance.net > 0.01 ? '+' : balance.net < -0.01 ? '-' : ''}{formatCurrency(Math.abs(balance.net), currency)}
            </p>
          </Card>
        </div>
      )}

      {/* Payment info */}
      {!isMe && (memberProfile.upi_id || memberProfile.qr_code_data) && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-brown-600" />
            <h3 className="text-sm font-semibold text-brown-800">Payment Information</h3>
          </div>
          {memberProfile.upi_id && (
            <div className="flex items-center gap-2 text-sm text-brown-700 mb-3">
              <CreditCard className="w-4 h-4 text-brown-400" />
              UPI: {memberProfile.upi_id}
            </div>
          )}
          {memberProfile.qr_code_data && (
            <div className="text-center">
              <div className="inline-block p-3 bg-white rounded-xl border border-cream-200">
                <img src={memberProfile.qr_code_data} alt="Payment QR" className="w-40 h-40" />
              </div>
              <Button variant="outline" size="sm" className="mt-3" onClick={shareQR}>
                <Share2 className="w-3.5 h-3.5" /> Share QR
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Expenses paid */}
      <div>
        <h3 className="text-sm font-semibold text-brown-800 mb-2">Expenses Paid ({paidExpenses.length})</h3>
        {paidExpenses.length === 0 ? (
          <Card className="p-4 text-center text-sm text-brown-400">No expenses paid yet.</Card>
        ) : (
          <div className="space-y-2">
            {paidExpenses.map((e) => (
              <Card key={e.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brown-800">{e.description}</p>
                  <p className="text-xs text-brown-400">{e.category}</p>
                </div>
                <span className="text-sm font-semibold text-brown-900 tabular-nums">{formatCurrency(Number(e.amount), currency)}</span>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Settlements */}
      {memberSettlements.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-brown-800 mb-2">Settlement History</h3>
          <div className="space-y-2">
            {memberSettlements.map((s) => {
              const isSender = s.from_user === memberId;
              const otherProfile = isSender ? s.to_profile : s.from_profile;
              return (
                <Card key={s.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brown-800">
                      {isSender ? 'Paid' : 'Received from'} {otherProfile?.name || 'Unknown'}
                    </p>
                    <Badge variant={s.status === 'confirmed' ? 'success' : s.status === 'disputed' ? 'danger' : 'warning'}>{s.status}</Badge>
                  </div>
                  <span className="text-sm font-semibold text-brown-900 tabular-nums">{formatCurrency(Number(s.amount), currency)}</span>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
