import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageWrapper } from '@/components/PageWrapper';
import { TableRowSkeleton } from '@/components/LoadingSkeleton';
import type { User } from '@/types';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setUsers(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = tab === 'all' ? users
    : tab === 'students' ? users.filter(u => u.role === 'student')
    : tab === 'faculty' ? users.filter(u => u.role === 'faculty')
    : users.filter(u => u.role === 'admin');

  return (
    <PageWrapper className="container py-6 space-y-6">
      <motion.h1
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-semibold text-foreground tracking-tight"
      >
        User Management
      </motion.h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({users.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({users.filter(u => u.role === 'student').length})</TabsTrigger>
          <TabsTrigger value="faculty">Faculty ({users.filter(u => u.role === 'faculty').length})</TabsTrigger>
          <TabsTrigger value="admin">Admins ({users.filter(u => u.role === 'admin').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card-shadow rounded-lg bg-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-body">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
                  ) : (
                    filtered.map((u, idx) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-foreground font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3 capitalize">
                          <span className={`inline-flex items-center gap-1.5 text-body ${
                            u.role === 'admin' ? 'text-primary font-semibold' : ''
                          }`}>
                            {u.role === 'admin' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`status-pill ${
                            u.approval_status === 'approved' ? 'status-done' :
                            u.approval_status === 'pending' ? 'status-pending' : 'status-undone'
                          }`}>
                            {u.approval_status}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
};

export default UserManagement;
