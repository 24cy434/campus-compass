import { motion } from 'framer-motion';
import { ChevronUp, Clock } from 'lucide-react';
import { StatusPill } from './StatusPill';
import type { Complaint } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ComplaintCardProps {
  complaint: Complaint;
  onVote?: (id: string) => void;
  showVotes?: boolean;
}

export const ComplaintCard = ({ complaint, onVote, showVotes = true }: ComplaintCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-shadow rounded-lg bg-card p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/complaints/${complaint.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {complaint.category?.name || 'Uncategorized'}
        </span>
        <StatusPill status={complaint.status} />
      </div>

      <h3 className="text-display text-foreground mb-1 line-clamp-1">{complaint.title}</h3>
      <p className="text-body text-muted-foreground line-clamp-2 mb-3">{complaint.description}</p>

      <div className="flex items-center justify-between">
        {showVotes && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onVote?.(complaint.id);
            }}
            className={`flex items-center gap-1 text-sm tabular-nums transition-colors ${
              complaint.user_voted
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <motion.div
              animate={complaint.user_voted ? { y: -2 } : { y: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              <ChevronUp className="h-4 w-4" />
            </motion.div>
            {complaint.vote_count || 0}
          </motion.button>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
        </div>
      </div>
    </motion.div>
  );
};
