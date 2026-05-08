import { Clock, Loader2, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG = {
  Pending:    { cls: 'badge-pending',    icon: Clock,         dot: 'bg-amber-500' },
  Processing: { cls: 'badge-processing', icon: Loader2,       dot: 'bg-blue-500' },
  Resolved:   { cls: 'badge-resolved',   icon: CheckCircle2,  dot: 'bg-emerald-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const Icon = cfg.icon;
  return (
    <span className={cfg.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
