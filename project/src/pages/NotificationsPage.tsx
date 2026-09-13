import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/format';
import { Notification } from '@/lib/types';

export function NotificationsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setNotifications((data || []) as Notification[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) return <LoadingState text="Loading notifications..." />;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brown-900">Notifications</h1>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bell className="w-7 h-7" />}
            title="No notifications"
            description="You'll see updates here when new expenses are added or payments are made."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={`p-4 ${!n.read ? 'border-l-4 border-l-brown-500' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-cream-200 flex items-center justify-center text-brown-600 flex-shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brown-800">{n.title}</p>
                  <p className="text-sm text-brown-500 mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-brown-400">{formatRelativeTime(n.created_at)}</span>
                    {n.group_id && (
                      <button onClick={() => navigate(`/groups/${n.group_id}`)} className="text-xs text-brown-600 hover:underline">
                        View group
                      </button>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteNotification(n.id)} className="text-brown-300 hover:text-danger-500 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
