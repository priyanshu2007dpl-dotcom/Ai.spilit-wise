import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Plus, Activity, User } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: '/add-expense', label: 'Add', icon: Plus, isCenter: true },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/profile', label: 'Profile', icon: User },
];

export function MobileBottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-cream-200 pb-safe lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="w-12 h-12 rounded-full bg-brown-600 text-cream-50 flex items-center justify-center shadow-lg hover:bg-brown-700 active:scale-95 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
              </button>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'text-brown-700' : 'text-brown-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
