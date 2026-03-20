import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { PageWrapper } from '@/components/PageWrapper';
import type { User } from '@/types';
import { toast } from 'sonner';
import { Check, X, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FacultyApproval = () => {
  const [pending, setPending] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'faculty')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });
    setPending(data || []);
    setLoading(false);
  };

  const handleApproval = async (userId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('profiles').update({ approval_status: status }).eq('id', userId);
    if (error) toast.error(error.message);
    else toast.success(`Faculty ${status}`);
    fetchPending();
  };

  return (
    <PageWrapper className="container py-6 space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Faculty Approval</h1>
        <p className="text-body text-muted-foreground mt-1">Review and approve faculty registration requests</p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="card-shadow rounded-lg bg-card p-4 h-20">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-48 rounded bg-muted animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-8 w-20 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : pending.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-shadow rounded-lg bg-card p-8 text-center">
          <UserCheck className="h-10 w-10 text-status-done mx-auto mb-3" />
          <p className="text-muted-foreground text-body">No pending faculty approvals.</p>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {pending.map((f, idx) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card-shadow rounded-lg bg-card p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-body font-medium text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApproval(f.id, 'approved')}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleApproval(f.id, 'rejected')}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </PageWrapper>
  );
};

export default FacultyApproval;
