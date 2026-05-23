import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-slate-300 mb-3">{icon}</div>
    <h3 className="text-[15px] font-semibold text-slate-600 mb-1">{title}</h3>
    {description && <p className="text-[13px] text-slate-400 mb-4 max-w-sm">{description}</p>}
    {action}
  </div>
);

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="flex items-center justify-between mb-5">
    <div>
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      {subtitle && <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'default';
  icon?: React.ReactNode;
  onClick?: () => void;
}

const colorMap = {
  blue: 'border-l-4 border-l-primary-500',
  green: 'border-l-4 border-l-success-500',
  yellow: 'border-l-4 border-l-warning-500',
  red: 'border-l-4 border-l-danger-500',
  default: '',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  color = 'default',
  icon,
  onClick,
}) => (
  <div
    className={`vl-card ${colorMap[color]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div>
        <div className="vl-card-header">{label}</div>
        <div className="vl-card-value">{value}</div>
        {sub && <div className="vl-card-sub">{sub}</div>}
      </div>
      {icon && <div className="text-slate-300">{icon}</div>}
    </div>
  </div>
);

export const formatCurrency = (amount: number): string => {
  return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatNumber = (n: number): string => {
  return n.toLocaleString();
};
