import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, QrCode, Wallet, Bell, LogOut, CreditCard, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { CURRENCIES, PAYMENT_METHODS, PaymentMethod } from '@/lib/types';
import { generateQRCode, buildUpiString } from '@/lib/qr';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(profile?.name || '');
  const [upiId, setUpiId] = useState(profile?.upi_id || '');
  const [currency, setCurrency] = useState(profile?.currency || 'INR');
  const [paymentMethod, setPaymentMethod] = useState(profile?.preferred_payment_method || 'upi');
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? true);
  const [qrCode, setQrCode] = useState<string | null>(profile?.qr_code_data || null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setUpiId(profile.upi_id || '');
      setCurrency(profile.currency);
      setPaymentMethod(profile.preferred_payment_method);
      setNotificationsEnabled(profile.notifications_enabled);
      setQrCode(profile.qr_code_data);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          upi_id: upiId || null,
          currency,
          preferred_payment_method: paymentMethod,
          notifications_enabled: notificationsEnabled,
          qr_code_data: qrCode,
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast('Could not update profile.', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!upiId.trim()) {
      showToast('Please enter your UPI ID first.', 'info');
      return;
    }
    setGenerating(true);
    try {
      const upiString = buildUpiString(upiId, name || 'User');
      const qr = await generateQRCode(upiString);
      setQrCode(qr);
      if (user) {
        await supabase.from('profiles').update({ qr_code_data: qr }).eq('id', user.id);
      }
      showToast('QR code generated!');
    } catch {
      showToast('Could not generate QR code.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareQR = async () => {
    if (!qrCode) return;
    if (navigator.share) {
      try {
        const response = await fetch(qrCode);
        const blob = await response.blob();
        const file = new File([blob], 'payment-qr.png', { type: 'image/png' });
        await navigator.share({ title: 'My Payment QR', files: [file] });
      } catch {}
    } else {
      navigator.clipboard.writeText(upiId);
      showToast('UPI ID copied to clipboard!');
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <h1 className="text-xl font-bold text-brown-900">Profile</h1>

      {/* Profile header */}
      <Card className="p-5 flex items-center gap-4">
        <Avatar name={profile.name} id={profile.id} size="xl" src={profile.avatar_url} />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-brown-900 truncate">{profile.name}</h2>
          <p className="text-sm text-brown-400 truncate">{profile.email}</p>
        </div>
      </Card>

      {/* Payment Info */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-brown-600" />
          <h3 className="text-sm font-semibold text-brown-800">Payment Details</h3>
        </div>
        <div className="space-y-4">
          <Input
            label="UPI ID"
            placeholder="yourname@upi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            icon={<CreditCard className="w-4 h-4" />}
          />
          <Select
            label="Preferred Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>

          {/* QR Code */}
          {qrCode ? (
            <div className="text-center">
              <div className="inline-block p-3 bg-white rounded-xl border border-cream-200">
                <img src={qrCode} alt="Payment QR" className="w-48 h-48" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleShareQR}>
                  <Share2 className="w-3.5 h-3.5" /> Share QR
                </Button>
                <Button variant="secondary" size="sm" className="flex-1" onClick={handleGenerateQR} loading={generating}>
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={handleGenerateQR} loading={generating} disabled={!upiId.trim()}>
              <QrCode className="w-4 h-4" /> Generate QR Code
            </Button>
          )}
        </div>
      </Card>

      {/* Personal Info */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-brown-600" />
          <h3 className="text-sm font-semibold text-brown-800">Personal Information</h3>
        </div>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" value={profile.email || ''} disabled icon={<Mail className="w-4 h-4" />} />
      </Card>

      {/* Preferences */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-brown-800">Preferences</h3>
        <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.symbol} {c.label} ({c.code})</option>
          ))}
        </Select>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-brown-400" />
            <span className="text-sm text-brown-700">Notifications</span>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${notificationsEnabled ? 'bg-brown-600' : 'bg-cream-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="danger" className="flex-1" onClick={() => { signOut(); navigate('/'); }}>
          <LogOut className="w-4 h-4" /> Logout
        </Button>
        <Button className="flex-1" loading={saving} onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
