import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

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
    <div className="container py-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-foreground tracking-tight">Faculty Approval</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="card-shadow rounded-lg bg-card p-4 h-20 animate-pulse" />)}
        </div>
      ) : pending.length === 0 ? (
        <div className="card-shadow rounded-lg bg-card p-8 text-center">
          <p className="text-muted-foreground text-body">No pending faculty approvals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(f => (
            <div key={f.id} className="card-shadow rounded-lg bg-card p-4 flex items-center justify-between">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyApproval;
