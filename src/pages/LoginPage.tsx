import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene3DLogin } from '@/components/Scene3DLogin';
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
  const [adminEmail, setAdminEmail] = useState('');
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
        const result = await adminLogin(adminEmail, password);
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
        if (!email.endsWith('@mgits.ac.in')) {
          setError('Please use your college email (e.g. 24cy434@mgits.ac.in)');
          return;
        }
        const result = await signUp(email, password, name, roleTab as UserRole);
        if (result.error) { setError(result.error); return; }
        if (roleTab === 'faculty') {
          setSuccess('Registration submitted. Awaiting admin approval.');
        } else {
          setSuccess('Account created! You can now sign in.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* 3D animated background */}
      <Scene3DLogin />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + heading */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div
            className="inline-flex h-14 w-14 rounded-xl bg-primary items-center justify-center mb-4 shadow-lg"
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <span className="text-primary-foreground text-xl font-bold">R</span>
          </motion.div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Complaint Management System
          </h1>
          <p className="text-body text-muted-foreground mt-1">
            Report and track issues efficiently
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="rounded-xl bg-card/90 backdrop-blur-lg p-6 shadow-2xl border border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Role tabs */}
          <div className="flex rounded-lg bg-muted/80 p-1 mb-6">
            {(['student', 'faculty', 'admin'] as RoleTab[]).map(tab => (
              <motion.button
                key={tab}
                onClick={() => { setRoleTab(tab); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 text-body rounded-md transition-all capitalize relative ${
                  roleTab === tab
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                {roleTab === tab && (
                  <motion.div
                    layoutId="login-tab"
                    className="absolute inset-0 bg-card rounded-md shadow-sm"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                {tab}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={`${roleTab}-${mode}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {roleTab === 'admin' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-body">Admin Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="bg-background/50"
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
                      className="bg-background/50"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="name" className="text-body">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="John Doe"
                        className="bg-background/50"
                        required
                      />
                    </motion.div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-body">College Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="24cy434@mgits.ac.in"
                      className="bg-background/50"
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
                      className="bg-background/50"
                      minLength={6}
                      required
                    />
                  </div>
                </>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-status-done bg-status-done/10 rounded-lg px-3 py-2"
                >
                  {success}
                </motion.p>
              )}

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={loading}>
                  {loading ? (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Please wait...
                    </motion.span>
                  ) : roleTab === 'admin' ? 'Sign In' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </Button>
              </motion.div>

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
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
