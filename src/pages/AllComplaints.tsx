import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ComplaintCard } from '@/components/ComplaintCard';
import { PageWrapper } from '@/components/PageWrapper';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import type { Complaint, Category, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const AllComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState('student');
  const perPage = 12;

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []));
    supabase.from('profiles').select('*').then(({ data }) => setProfiles(data || []));
  }, []);

  useEffect(() => { fetchComplaints(); }, [page, filterCategory, filterStatus, tab, profiles]);

  const fetchComplaints = async () => {
    if (profiles.length === 0) return;
    setLoading(true);
    const roleUserIds = profiles.filter(p => tab === 'student' ? p.role === 'student' : p.role === 'faculty').map(p => p.id);
    if (roleUserIds.length === 0) { setComplaints([]); setLoading(false); return; }

    let query = supabase.from('complaints').select('*, category:categories(*)').in('user_id', roleUserIds).order('created_at', { ascending: false }).range(page * perPage, (page + 1) * perPage - 1);
    if (filterCategory !== 'all') query = query.eq('category_id', filterCategory);
    if (filterStatus !== 'all') query = query.eq('status', filterStatus);

    const { data } = await query;
    const enriched = (data || []).map(c => ({ ...c, user: profiles.find(p => p.id === c.user_id) }));
    setComplaints(enriched);
    setLoading(false);
  };

  return (
    <PageWrapper className="container py-6 space-y-6">
      <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-semibold text-foreground tracking-tight">All Complaints</motion.h1>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(0); }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="student">Student Complaints</TabsTrigger>
            <TabsTrigger value="faculty">Faculty Complaints</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(0); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="undone">Undone</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setPage(0); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {['student', 'faculty'].map(tabVal => (
          <TabsContent key={tabVal} value={tabVal} className="mt-4">
            {loading ? (
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={container} initial="hidden" animate="show">
                {Array.from({ length: 3 }).map((_, i) => <motion.div key={i} variants={item}><CardSkeleton /></motion.div>)}
              </motion.div>
            ) : complaints.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-shadow rounded-lg bg-card p-8 text-center">
                <p className="text-muted-foreground text-body">No complaints found.</p>
              </motion.div>
            ) : (
              <>
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={container} initial="hidden" animate="show">
                  {complaints.map(c => (
                    <motion.div key={c.id} variants={item} className="relative">
                      <ComplaintCard complaint={c} showVotes={false} />
                      {c.user && (
                        <div className="absolute top-2 right-2">
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">{c.user.name}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
                <div className="flex justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span className="text-body text-muted-foreground self-center tabular-nums">Page {page + 1}</span>
                  <Button variant="outline" size="sm" disabled={complaints.length < perPage} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </PageWrapper>
  );
};

export default AllComplaints;
