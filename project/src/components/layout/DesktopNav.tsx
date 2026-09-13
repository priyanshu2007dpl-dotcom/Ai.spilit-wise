import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Plus, Activity, User, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: '/add-expense', label: 'Add Expense', icon: Plus },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/profile', label: 'Profile', icon: User },
];

export function DesktopNav() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('read', false)
      .then(({ count }) => setUnreadCount(count || 0));
  }, [profile]);

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-cream-200 h-screen sticky top-0">
      <div className="p-5 border-b border-cream-200">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brown-600 flex items-center justify-center">
            <span className="text-cream-50 font-bold text-lg">S</span>
          </div>
          <div>
            <p className="font-bold text-brown-900">SplitWise AI</p>
            <p className="text-xs text-brown-400">Expense Splitting</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brown-100 text-brown-800'
                    : 'text-brown-500 hover:bg-cream-100 hover:text-brown-700'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-cream-200 space-y-2">
        <button
          onClick={() => navigate('/notifications')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brown-500 hover:bg-cream-100 hover:text-brown-700 transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="absolute right-3 top-2 w-5 h-5 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 px-3 py-2">
          {profile && (
            <Avatar name={profile.name} id={profile.id} size="sm" src={profile.avatar_url} />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brown-800 truncate">{profile?.name}</p>
            <p className="text-xs text-brown-400 truncate">{profile?.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="text-brown-400 hover:text-danger-600 p-1.5 rounded-lg hover:bg-cream-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
