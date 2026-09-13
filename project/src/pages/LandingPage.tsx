import { useNavigate } from 'react-router-dom';
import { Split, Users, Receipt, QrCode, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream-50/80 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brown-600 flex items-center justify-center">
              <Split className="w-5 h-5 text-cream-50" />
            </div>
            <span className="font-bold text-brown-900 text-lg">SplitWise AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream-200 rounded-full text-sm text-brown-600 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered expense splitting
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-brown-900 leading-tight mb-4">
            Split expenses.
            <br />
            Settle up. Done.
          </h1>
          <p className="text-lg text-brown-500 mb-8 max-w-xl mx-auto">
            AI-powered group expense splitting that calculates everyone's share automatically.
            Just describe what you paid — the app handles the rest.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate(user ? '/dashboard' : '/signup')} className="w-full sm:w-auto">
              Create Group
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate(user ? '/dashboard' : '/login')} className="w-full sm:w-auto">
              Join Group
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Sparkles, title: 'Natural Language Entry', desc: 'Just type "I paid ₹1200 for dinner for 4 people" — AI understands the split.' },
            { icon: Users, title: 'Smart Balance Calculation', desc: 'Automatically tracks who owes whom and minimizes settlement transactions.' },
            { icon: QrCode, title: 'QR / UPI Payments', desc: 'Share your QR code or UPI ID. Mark payments as paid and get confirmation.' },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="bg-white rounded-2xl p-5 shadow-card">
                <div className="w-11 h-11 rounded-xl bg-brown-100 flex items-center justify-center text-brown-600 mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-brown-900 mb-1">{feat.title}</h3>
                <p className="text-sm text-brown-500">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-brown-900 text-center mb-8">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Create a Group', desc: 'Invite friends with a code' },
            { step: '2', title: 'Add Expenses', desc: 'Type naturally, AI splits it' },
            { step: '3', title: 'Track Balances', desc: 'See who owes what instantly' },
            { step: '4', title: 'Settle Up', desc: 'Pay via QR/UPI and confirm' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-brown-600 text-cream-50 flex items-center justify-center font-bold mx-auto mb-3">
                {item.step}
              </div>
              <h3 className="font-medium text-brown-800 text-sm">{item.title}</h3>
              <p className="text-xs text-brown-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-cream-200 py-6 mt-12">
        <p className="text-center text-sm text-brown-400">SplitWise AI — Effortless group expense management</p>
      </footer>
    </div>
  );
}
