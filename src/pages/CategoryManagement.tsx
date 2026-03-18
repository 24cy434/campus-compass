import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category, User } from '@/types';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const CategoryManagement = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: cats }, { data: fac }, { data: assigns }] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('profiles').select('*').eq('role', 'faculty').eq('approval_status', 'approved'),
      supabase.from('category_faculty').select('*'),
    ]);
    setCategories(cats || []);
    setFaculty(fac || []);
    
    const map: Record<string, string[]> = {};
    (assigns || []).forEach(a => {
      if (!map[a.category_id]) map[a.category_id] = [];
      map[a.category_id].push(a.faculty_id);
    });
    setAssignments(map);
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('categories').insert({
      name: newName.trim(),
      description: newDesc.trim(),
      created_by: user.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Category created');
      setNewName('');
      setNewDesc('');
      fetchData();
    }
    setLoading(false);
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    toast.success('Category deleted');
    fetchData();
  };

  const assignFaculty = async (categoryId: string, facultyId: string) => {
    const { error } = await supabase.from('category_faculty').insert({
      category_id: categoryId,
      faculty_id: facultyId,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Faculty assigned');
      fetchData();
    }
  };

  const removeFacultyAssignment = async (categoryId: string, facultyId: string) => {
    await supabase.from('category_faculty').delete().eq('category_id', categoryId).eq('faculty_id', facultyId);
    toast.success('Assignment removed');
    fetchData();
  };

  return (
    <div className="container py-6 space-y-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-foreground tracking-tight">Category Management</h1>

      {/* Create category */}
      <form onSubmit={createCategory} className="card-shadow rounded-lg bg-card p-6 space-y-4">
        <h2 className="text-display text-foreground">Create Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-body font-medium">Name</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Plumbing" required />
          </div>
          <div className="space-y-2">
            <Label className="text-body font-medium">Description</Label>
            <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional description" rows={1} />
          </div>
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </form>

      {/* Categories list with faculty assignment */}
      <div className="space-y-4">
        {categories.map(cat => (
          <div key={cat.id} className="card-shadow rounded-lg bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-display text-foreground">{cat.name}</h3>
                {cat.description && <p className="text-body text-muted-foreground">{cat.description}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            {/* Assigned faculty */}
            <div className="space-y-2">
              <span className="text-label text-muted-foreground">ASSIGNED FACULTY</span>
              <div className="flex flex-wrap gap-2">
                {(assignments[cat.id] || []).map(fId => {
                  const f = faculty.find(x => x.id === fId);
                  return f ? (
                    <span key={fId} className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-body">
                      {f.name}
                      <button onClick={() => removeFacultyAssignment(cat.id, fId)} className="text-muted-foreground hover:text-foreground">×</button>
                    </span>
                  ) : null;
                })}
              </div>
              <Select onValueChange={v => assignFaculty(cat.id, v)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Assign faculty..." />
                </SelectTrigger>
                <SelectContent>
                  {faculty
                    .filter(f => !(assignments[cat.id] || []).includes(f.id))
                    .map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManagement;
