import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Split, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, name);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-100">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-1 text-sm text-brown-500 hover:text-brown-700 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brown-600 flex items-center justify-center">
              <Split className="w-5 h-5 text-cream-50" />
            </div>
            <span className="font-bold text-brown-900 text-lg">SplitWise AI</span>
          </div>

          <h1 className="text-2xl font-bold text-brown-900 mb-1">Create account</h1>
          <p className="text-sm text-brown-500 mb-6">Start splitting expenses with your group</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            {error && (
              <div className="bg-danger-50 border border-danger-500/20 rounded-xl px-4 py-3 text-sm text-danger-700">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-brown-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brown-700 hover:text-brown-900">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
