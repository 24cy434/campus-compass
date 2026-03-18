import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ComplaintCard } from '@/components/ComplaintCard';
import type { Complaint } from '@/types';
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

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

    // Fetch recent public complaints
    const { data: publicComplaints } = await supabase
      .from('complaints')
      .select('*, category:categories(*)')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(6);

    // Fetch vote counts
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

    // Fetch stats based on role
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
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'faculty' ? 'Faculty Dashboard' : 'Dashboard'}
        </h1>
        <p className="text-body text-muted-foreground mt-1">
          Welcome back, {user?.name || 'User'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-shadow rounded-lg bg-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-semibold tabular-nums ${stat.color}`}>{loading ? '—' : stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent public complaints */}
      <div>
        <h2 className="text-display text-foreground mb-4">Recent Public Issues</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-shadow rounded-lg bg-card p-4 h-40 animate-pulse" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="card-shadow rounded-lg bg-card p-8 text-center">
            <p className="text-muted-foreground text-body">No public issues yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.map(complaint => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onVote={handleVote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
