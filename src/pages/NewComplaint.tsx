import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageWrapper } from '@/components/PageWrapper';
import type { Category } from '@/types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const NewComplaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !categoryId) return;
    setLoading(true);

    const { data: assignment } = await supabase
      .from('category_faculty')
      .select('faculty_id')
      .eq('category_id', categoryId)
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase.from('complaints').insert({
      user_id: user.id,
      category_id: categoryId,
      title: title.trim(),
      description: description.trim(),
      visibility,
      status: 'pending',
      assigned_to: assignment?.faculty_id || null,
    }).select().single();

    if (error) {
      toast.error(error.message);
    } else {
      await supabase.from('status_log').insert({
        complaint_id: data.id,
        action_type: 'Complaint created',
        performed_by: user.id,
      });

      if (assignment?.faculty_id) {
        await supabase.from('notifications').insert({
          user_id: assignment.faculty_id,
          complaint_id: data.id,
          message: `New issue assigned: "${title.trim()}"`,
        });
      }

      toast.success(`Issue #${data.id.slice(0, 8)} created.`);
      navigate('/my-complaints');
    }
    setLoading(false);
  };

  return (
    <PageWrapper className="container py-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">Report an Issue</h1>
        <p className="text-body text-muted-foreground mb-6">Describe the issue and select a category for automatic assignment.</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="card-shadow rounded-lg bg-card p-6 space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="title" className="text-body font-medium">Title</Label>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief summary of the issue" maxLength={200} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc" className="text-body font-medium">Description</Label>
          <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed description of the issue..." rows={5} maxLength={2000} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-body font-medium">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-body font-medium">Visibility</Label>
            <Select value={visibility} onValueChange={v => setVisibility(v as 'public' | 'private')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public — visible to all</SelectItem>
                <SelectItem value="private">Private — only you & assigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={loading || !categoryId}>
            {loading ? 'Submitting...' : 'Submit Issue'}
          </Button>
        </div>
      </motion.form>
    </PageWrapper>
  );
};

export default NewComplaint;
