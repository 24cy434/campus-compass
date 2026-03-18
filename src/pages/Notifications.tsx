import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setNotifications(data || []);
        setLoading(false);
        // Mark as read
        if (data?.length) {
          const unread = data.filter(n => !n.is_read).map(n => n.id);
          if (unread.length) {
            supabase.from('notifications').update({ is_read: true }).in('id', unread).then(() => {});
          }
        }
      });
  }, [user]);

  return (
    <div className="container py-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground tracking-tight">Notifications</h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="card-shadow rounded-lg bg-card p-4 h-16 animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card-shadow rounded-lg bg-card p-8 text-center">
          <p className="text-muted-foreground text-body">No notifications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => n.complaint_id && navigate(`/complaints/${n.complaint_id}`)}
              className={`card-shadow rounded-lg bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                !n.is_read ? 'border-l-2 border-l-primary' : ''
              }`}
            >
              <p className="text-body text-foreground">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
