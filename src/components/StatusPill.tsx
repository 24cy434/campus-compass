import { motion } from 'framer-motion';
import type { ComplaintStatus } from '@/types';

const statusStyles: Record<string, string> = {
  pending: 'status-pending',
  processing: 'status-processing',
  done: 'status-done',
  undone: 'status-undone',
};

interface StatusPillProps {
  status: ComplaintStatus;
}

export const StatusPill = ({ status }: StatusPillProps) => (
  <motion.span
    layout
    className={`status-pill ${statusStyles[status]}`}
    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
  >
    {status}
  </motion.span>
);
