// 现代化状态标签组件
import React from 'react';

export interface StatusBadgeProps {
  status: 'pending' | 'interviewed' | 'rejected' | 'hired';
  size?: 'small' | 'default' | 'large';
}

const statusConfig = {
  pending: {
    label: '待处理',
    color: 'var(--warning-500)',
    background: 'var(--warning-50)',
    border: 'var(--warning-200)',
  },
  interviewed: {
    label: '已面试',
    color: 'var(--primary-500)',
    background: 'var(--primary-50)',
    border: 'var(--primary-200)',
  },
  rejected: {
    label: '已拒绝',
    color: 'var(--error-500)',
    background: 'var(--error-50)',
    border: 'var(--error-200)',
  },
  hired: {
    label: '已录用',
    color: 'var(--success-500)',
    background: 'var(--success-50)',
    border: 'var(--success-200)',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'default' }) => {
  const config = statusConfig[status];
  
  const sizeStyles = {
    small: { fontSize: '10px', padding: '2px 8px' },
    default: { fontSize: '12px', padding: '4px 12px' },
    large: { fontSize: '14px', padding: '6px 16px' },
  };

  return (
    <span
      className="status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: config.background,
        color: config.color,
        border: `1px solid ${config.border}`,
        borderRadius: 'var(--radius-full)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        transition: 'all var(--transition-fast)',
        ...sizeStyles[size],
      }}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
