const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colors = {
    indigo: 'from-indigo-500 to-indigo-600',
    amber:  'from-amber-500 to-amber-600',
    blue:   'from-blue-500 to-blue-600',
    emerald:'from-emerald-500 to-emerald-600',
    violet: 'from-violet-500 to-violet-600',
  };
  const bgColors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
    amber:  'bg-amber-50 dark:bg-amber-900/20',
    blue:   'bg-blue-50 dark:bg-blue-900/20',
    emerald:'bg-emerald-50 dark:bg-emerald-900/20',
    violet: 'bg-violet-50 dark:bg-violet-900/20',
  };
  return (
    <div className="card hover:shadow-md transition-shadow duration-200 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${bgColors[color] || bgColors.indigo} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 bg-gradient-to-br ${colors[color] || colors.indigo} bg-clip-text`} style={{ color: `var(--tw-gradient-from)` }} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
