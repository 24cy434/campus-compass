import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ComplaintCard } from '@/components/ComplaintCard';
import { PageWrapper } from '@/components/PageWrapper';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import type { Complaint } from '@/types';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const PublicComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const perPage = 12;

  useEffect(() => {
    fetchComplaints();
  }, [user, page]);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('complaints')
      .select('*, category:categories(*)')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(page * perPage, (page + 1) * perPage - 1);

    if (data && user) {
      const withVotes = await Promise.all(
        data.map(async (c) => {
          const { count } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('complaint_id', c.id);
          const { data: userVote } = await supabase.from('votes').select('id').eq('complaint_id', c.id).eq('user_id', user.id).maybeSingle();
          return { ...c, vote_count: count || 0, user_voted: !!userVote };
        })
      );
      setComplaints(withVotes);
    } else {
      setComplaints(data || []);
    }
    setLoading(false);
  };

  const handleVote = async (complaintId: string) => {
    if (!user) return;
    const c = complaints.find(x => x.id === complaintId);
    if (!c) return;
    if (c.user_voted) {
      await supabase.from('votes').delete().eq('complaint_id', complaintId).eq('user_id', user.id);
    } else {
      await supabase.from('votes').insert({ complaint_id: complaintId, user_id: user.id });
    }
    fetchComplaints();
  };

  return (
    <PageWrapper className="container py-6 space-y-6">
      <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-semibold text-foreground tracking-tight">Public Issues</motion.h1>

      {loading ? (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={container} initial="hidden" animate="show">
          {Array.from({ length: 6 }).map((_, i) => <motion.div key={i} variants={item}><CardSkeleton /></motion.div>)}
        </motion.div>
      ) : complaints.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-shadow rounded-lg bg-card p-8 text-center">
          <p className="text-muted-foreground text-body">No public issues yet.</p>
        </motion.div>
      ) : (
        <>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={container} initial="hidden" animate="show">
            {complaints.map(c => <motion.div key={c.id} variants={item}><ComplaintCard complaint={c} onVote={handleVote} /></motion.div>)}
          </motion.div>
          <div className="flex justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-body text-muted-foreground self-center tabular-nums">Page {page + 1}</span>
            <Button variant="outline" size="sm" disabled={complaints.length < perPage} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </>
      )}
    </PageWrapper>
  );
};

export default PublicComplaints;
