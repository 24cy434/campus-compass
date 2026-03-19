import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Complaint, ComplaintStatus, StatusLog, User as UserType } from '@/types';
import { ArrowLeft, ChevronUp, Clock, User, UserCheck } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const ComplaintDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [logs, setLogs] = useState<StatusLog[]>([]);
  const [voteCount, setVoteCount] = useState(0);
  const [userVoted, setUserVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [faculty, setFaculty] = useState<UserType[]>([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [assignedName, setAssignedName] = useState('');
  const [submitterName, setSubmitterName] = useState('');

  useEffect(() => {
    if (id) fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    if (!id) return;
    setLoading(true);

    const { data } = await supabase
      .from('complaints')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();

    if (data) {
      setComplaint(data);
      setNewStatus(data.status);

      const { count } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('complaint_id', id);
      setVoteCount(count || 0);

      if (user) {
        const { data: v } = await supabase.from('votes').select('id').eq('complaint_id', id).eq('user_id', user.id).maybeSingle();
        setUserVoted(!!v);
      }

      const { data: logData } = await supabase
        .from('status_log')
        .select('*')
        .eq('complaint_id', id)
        .order('timestamp', { ascending: false });
      setLogs(logData || []);
    }
    setLoading(false);
  };

  const handleVote = async () => {
    if (!user || !id) return;
    if (userVoted) {
      await supabase.from('votes').delete().eq('complaint_id', id).eq('user_id', user.id);
    } else {
      await supabase.from('votes').insert({ complaint_id: id, user_id: user.id });
    }
    fetchComplaint();
  };

  const handleStatusChange = async () => {
    if (!user || !complaint || !newStatus || newStatus === complaint.status) return;
    
    await supabase.from('complaints').update({ status: newStatus }).eq('id', complaint.id);
    await supabase.from('status_log').insert({
      complaint_id: complaint.id,
      action_type: `Status changed to ${newStatus}`,
      performed_by: user.id,
    });
    await supabase.from('notifications').insert({
      user_id: complaint.user_id,
      complaint_id: complaint.id,
      message: `Issue "${complaint.title}" status updated to ${newStatus}.`,
    });
    toast.success(`Status updated to ${newStatus}`);
    fetchComplaint();
  };

  if (loading) {
    return <div className="container py-6"><div className="card-shadow rounded-lg bg-card p-8 h-60 animate-pulse" /></div>;
  }

  if (!complaint) {
    return (
      <div className="container py-6">
        <p className="text-muted-foreground">Complaint not found.</p>
      </div>
    );
  }

  const canChangeStatus = user && (user.role === 'admin' || (user.role === 'faculty' && complaint.assigned_to === user.id));

  return (
    <div className="container py-6 max-w-3xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-body text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-shadow rounded-lg bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {complaint.category?.name || 'Uncategorized'}
              </span>
              <StatusPill status={complaint.status} />
              {complaint.visibility === 'private' && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Private</span>
              )}
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">{complaint.title}</h1>
          </div>

          {complaint.visibility === 'public' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleVote}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                userVoted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <ChevronUp className="h-5 w-5" />
              <span className="text-sm font-semibold tabular-nums">{voteCount}</span>
            </motion.button>
          )}
        </div>

        <p className="text-body text-foreground whitespace-pre-wrap">{complaint.description}</p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(complaint.created_at), 'PPp')}</span>
          <span className="flex items-center gap-1"><User className="h-3 w-3" /> ID: {complaint.id.slice(0, 8)}</span>
        </div>
      </motion.div>

      {/* Status change for faculty/admin */}
      {canChangeStatus && (
        <div className="card-shadow rounded-lg bg-card p-4">
          <h2 className="text-display text-foreground mb-3">Update Status</h2>
          <div className="flex gap-3">
            <Select value={newStatus} onValueChange={v => setNewStatus(v as ComplaintStatus)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['pending', 'processing', 'done', 'undone'] as ComplaintStatus[]).map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleStatusChange} disabled={newStatus === complaint.status}>
              Update
            </Button>
          </div>
        </div>
      )}

      {/* Activity log */}
      {logs.length > 0 && (
        <div className="card-shadow rounded-lg bg-card p-4">
          <h2 className="text-display text-foreground mb-3">Activity Log</h2>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-3 text-body text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-border flex-shrink-0" />
                <span className="flex-1">{log.action_type}</span>
                <span className="text-xs tabular-nums">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetail;
