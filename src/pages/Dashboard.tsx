import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ComplaintCard } from '@/components/ComplaintCard';
import { PageWrapper } from '@/components/PageWrapper';
import { StatSkeleton, CardSkeleton } from '@/components/LoadingSkeleton';
import type { Complaint } from '@/types';
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const Dashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, done: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: publicComplaints } = await supabase
      .from('complaints')
      .select('*, category:categories(*)')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(6);

    if (publicComplaints) {
      const withVotes = await Promise.all(
        publicComplaints.map(async (c) => {
          const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('complaint_id', c.id);
          const { data: userVote } = await supabase
            .from('votes')
            .select('id')
            .eq('complaint_id', c.id)
            .eq('user_id', user!.id)
            .maybeSingle();
          return { ...c, vote_count: count || 0, user_voted: !!userVote };
        })
      );
      setComplaints(withVotes);
    }

    let query = supabase.from('complaints').select('status');
    if (user.role === 'student') {
      query = query.eq('user_id', user.id);
    } else if (user.role === 'faculty') {
      query = query.eq('assigned_to', user.id);
    }
    const { data: allComplaints } = await query;
    if (allComplaints) {
      setStats({
        total: allComplaints.length,
        pending: allComplaints.filter(c => c.status === 'pending').length,
        processing: allComplaints.filter(c => c.status === 'processing').length,
        done: allComplaints.filter(c => c.status === 'done').length,
      });
    }
    setLoading(false);
  };

  const handleVote = async (complaintId: string) => {
    if (!user) return;
    const complaint = complaints.find(c => c.id === complaintId);
    if (!complaint) return;

    if (complaint.user_voted) {
      await supabase.from('votes').delete().eq('complaint_id', complaintId).eq('user_id', user.id);
    } else {
      await supabase.from('votes').insert({ complaint_id: complaintId, user_id: user.id });
    }
    fetchData();
  };

  const statCards = [
    { label: 'Total Issues', value: stats.total, icon: FileText, color: 'text-foreground' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-status-pending' },
    { label: 'Processing', value: stats.processing, icon: AlertTriangle, color: 'text-status-processing' },
    { label: 'Resolved', value: stats.done, icon: CheckCircle, color: 'text-status-done' },
  ];

  return (
    <PageWrapper className="container py-6 space-y-6">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'faculty' ? 'Faculty Dashboard' : 'Dashboard'}
        </h1>
        <p className="text-body text-muted-foreground mt-1">
          Welcome back, {user?.name || 'User'}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={container} initial="hidden" animate="show">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          statCards.map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="card-shadow rounded-lg bg-card p-4 cursor-default"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <motion.p
                key={stat.value}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-2xl font-semibold tabular-nums ${stat.color}`}
              >
                {stat.value}
              </motion.p>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Recent public complaints */}
      <div>
        <h2 className="text-display text-foreground mb-4">Recent Public Issues</h2>
        {loading ? (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={container} initial="hidden" animate="show">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div key={i} variants={item}><CardSkeleton /></motion.div>
            ))}
          </motion.div>
        ) : complaints.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-shadow rounded-lg bg-card p-8 text-center">
            <p className="text-muted-foreground text-body">No public issues yet.</p>
          </motion.div>
        ) : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={container} initial="hidden" animate="show">
            {complaints.map(complaint => (
              <motion.div key={complaint.id} variants={item}>
                <ComplaintCard complaint={complaint} onVote={handleVote} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
