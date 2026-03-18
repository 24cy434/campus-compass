import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ComplaintCard } from '@/components/ComplaintCard';
import type { Complaint, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AllComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const perPage = 12;

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [page, filterCategory]);

  const fetchComplaints = async () => {
    setLoading(true);
    let query = supabase
      .from('complaints')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false })
      .range(page * perPage, (page + 1) * perPage - 1);

    if (filterCategory !== 'all') {
      query = query.eq('category_id', filterCategory);
    }

    const { data } = await query;
    setComplaints(data || []);
    setLoading(false);
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">All Complaints</h1>
        <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setPage(0); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="card-shadow rounded-lg bg-card p-4 h-40 animate-pulse" />)}
        </div>
      ) : complaints.length === 0 ? (
        <div className="card-shadow rounded-lg bg-card p-8 text-center">
          <p className="text-muted-foreground text-body">No complaints found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.map(c => <ComplaintCard key={c.id} complaint={c} showVotes={false} />)}
          </div>
          <div className="flex justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-body text-muted-foreground self-center tabular-nums">Page {page + 1}</span>
            <Button variant="outline" size="sm" disabled={complaints.length < perPage} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AllComplaints;
