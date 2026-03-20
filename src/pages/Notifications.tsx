import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageWrapper } from '@/components/PageWrapper';
import type { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };

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
        if (data?.length) {
          const unread = data.filter(n => !n.is_read).map(n => n.id);
          if (unread.length) {
            supabase.from('notifications').update({ is_read: true }).in('id', unread).then(() => {});
          }
        }
      });
  }, [user]);

  return (
    <PageWrapper className="container py-6 space-y-6 max-w-2xl">
      <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-semibold text-foreground tracking-tight">Notifications</motion.h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }} className="card-shadow rounded-lg bg-card p-4">
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse mb-2" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </motion.div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-shadow rounded-lg bg-card p-8 text-center">
          <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-body">No notifications.</p>
        </motion.div>
      ) : (
        <motion.div className="space-y-2" variants={container} initial="hidden" animate="show">
          {notifications.map(n => (
            <motion.div
              key={n.id}
              variants={item}
              whileHover={{ x: 4 }}
              onClick={() => n.complaint_id && navigate(`/complaints/${n.complaint_id}`)}
              className={`card-shadow rounded-lg bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                !n.is_read ? 'border-l-2 border-l-primary' : ''
              }`}
            >
              <p className="text-body text-foreground">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageWrapper>
  );
};

export default Notifications;
