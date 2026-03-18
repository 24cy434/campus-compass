import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserRole } from '@/types';

type AuthMode = 'login' | 'register';
type RoleTab = 'student' | 'faculty' | 'admin';

const LoginPage = () => {
  const { signIn, signUp, adminLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [roleTab, setRoleTab] = useState<RoleTab>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (roleTab === 'admin') {
        const result = await adminLogin(adminUsername, password);
        if (result.error) { setError(result.error); return; }
        navigate('/');
        return;
      }

      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) { setError(result.error); return; }
        navigate('/');
      } else {
        if (!name.trim()) { setError('Name is required'); return; }
        const result = await signUp(email, password, name, roleTab as UserRole);
        if (result.error) { setError(result.error); return; }
        if (roleTab === 'faculty') {
          setSuccess('Registration submitted. Awaiting admin approval.');
        } else {
          setSuccess('Account created. Check your email to confirm.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-lg bg-primary items-center justify-center mb-4">
            <span className="text-primary-foreground text-lg font-bold">R</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Complaint Management System
          </h1>
          <p className="text-body text-muted-foreground mt-1">
            Report and track issues efficiently
          </p>
        </div>

        <div className="card-shadow rounded-lg bg-card p-6">
          {/* Role tabs */}
          <div className="flex rounded-md bg-muted p-1 mb-6">
            {(['student', 'faculty', 'admin'] as RoleTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => { setRoleTab(tab); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 text-body rounded-md transition-all capitalize ${
                  roleTab === tab
                    ? 'bg-card card-shadow text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={`${roleTab}-${mode}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {roleTab === 'admin' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="admin-user" className="text-body">Username</Label>
                    <Input
                      id="admin-user"
                      value={adminUsername}
                      onChange={e => setAdminUsername(e.target.value)}
                      placeholder="ADMIN@1234"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-pass" className="text-body">Password</Label>
                    <Input
                      id="admin-pass"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  {mode === 'register' && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-body">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-body">College Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@college.edu"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-body">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="text-sm text-destructive bg-destructive/5 rounded-md px-3 py-2">{error}</p>
              )}
              {success && (
                <p className="text-sm text-status-done bg-muted rounded-md px-3 py-2">{success}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait...' : roleTab === 'admin' ? 'Sign In' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>

              {roleTab !== 'admin' && (
                <p className="text-center text-body text-muted-foreground">
                  {mode === 'login' ? (
                    <>Don't have an account?{' '}
                      <button type="button" onClick={() => { setMode('register'); setError(''); }} className="text-primary font-medium hover:underline">
                        Register
                      </button>
                    </>
                  ) : (
                    <>Already have an account?{' '}
                      <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-primary font-medium hover:underline">
                        Sign In
                      </button>
                    </>
                  )}
                </p>
              )}
            </motion.form>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
