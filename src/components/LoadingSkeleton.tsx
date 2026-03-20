import { motion } from 'framer-motion';

export const CardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="card-shadow rounded-lg bg-card p-4 space-y-3"
  >
    <div className="flex justify-between">
      <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
      <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
    </div>
    <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
    <div className="space-y-1.5">
      <div className="h-3 w-full rounded bg-muted animate-pulse" />
      <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
    </div>
    <div className="flex justify-between pt-1">
      <div className="h-4 w-10 rounded bg-muted animate-pulse" />
      <div className="h-3 w-24 rounded bg-muted animate-pulse" />
    </div>
  </motion.div>
);

export const StatSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="card-shadow rounded-lg bg-card p-4 space-y-3"
  >
    <div className="flex justify-between">
      <div className="h-3 w-16 rounded-full bg-muted animate-pulse" />
      <div className="h-4 w-4 rounded bg-muted animate-pulse" />
    </div>
    <div className="h-8 w-12 rounded bg-muted animate-pulse" />
  </motion.div>
);

export const TableRowSkeleton = ({ cols = 4 }: { cols?: number }) => (
  <tr className="border-b border-border">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className={`h-4 rounded bg-muted animate-pulse ${i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'w-40'}`} />
      </td>
    ))}
  </tr>
);

export const FullPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-body text-muted-foreground"
      >
        Loading...
      </motion.p>
    </motion.div>
  </div>
);
