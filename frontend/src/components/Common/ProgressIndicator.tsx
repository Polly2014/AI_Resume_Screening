import React from 'react';
import { Progress, Spin, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ProgressIndicatorProps {
  /** 进度百分比 (0-100) */
  percent?: number;
  /** 显示状态 */
  status?: 'normal' | 'active' | 'success' | 'exception';
  /** 进度条类型 */
  type?: 'line' | 'circle' | 'dashboard';
  /** 显示文本 */
  text?: string;
  /** 是否显示为加载状态 */
  loading?: boolean;
  /** 大小 */
  size?: 'small' | 'default' | 'large';
  /** 是否显示百分比 */
  showPercent?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 主题模式 */
  theme?: 'default' | 'gradient' | 'glass';
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  percent = 0,
  status = 'normal',
  type = 'line',
  text,
  loading = false,
  size = 'default',
  showPercent = true,
  style,
  theme = 'gradient'
}) => {
  // 自定义加载图标
  const antIcon = (
    <LoadingOutlined 
      style={{ 
        fontSize: size === 'large' ? 24 : size === 'small' ? 14 : 18,
        color: 'var(--primary-500)'
      }} 
      spin 
    />
  );

  // 根据主题设置样式
  const getThemeStyles = () => {
    switch (theme) {
      case 'glass':
        return {
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        };
      case 'gradient':
        return {
          background: 'var(--gradient-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        };
      default:
        return {
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
        };
    }
  };

  // 获取进度条颜色
  const getProgressColor = () => {
    if (status === 'exception') return 'var(--error-500)';
    if (status === 'success') return 'var(--success-500)';
    return {
      '0%': 'var(--primary-400)',
      '100%': 'var(--primary-600)',
    };
  };

  if (loading) {
    return (
      <div 
        style={{ 
          ...getThemeStyles(),
          textAlign: 'center',
          ...style 
        }}
        className="animate-fadeIn"
      >
        <Spin 
          indicator={antIcon} 
          size={size}
          spinning={true}
        >
          <div style={{ padding: '20px 0' }}>
            {text && (
              <Text 
                style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: size === 'large' ? '16px' : size === 'small' ? '12px' : '14px',
                  marginTop: '8px',
                  display: 'block'
                }}
              >
                {text}
              </Text>
            )}
          </div>
        </Spin>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        ...getThemeStyles(),
        ...style 
      }}
      className="animate-fadeIn"
    >
      {text && (
        <Text 
          strong
          style={{ 
            color: 'var(--text-primary)',
            fontSize: size === 'large' ? '16px' : size === 'small' ? '12px' : '14px',
            marginBottom: '12px',
            display: 'block'
          }}
        >
          {text}
        </Text>
      )}
      
      <Progress
        percent={percent}
        status={status}
        type={type}
        size={type === 'line' ? (size === 'large' ? 'default' : 'small') : undefined}
        showInfo={showPercent}
        strokeColor={getProgressColor()}
        trailColor="var(--gray-200)"
        strokeWidth={type === 'line' ? (size === 'large' ? 8 : size === 'small' ? 4 : 6) : undefined}
        style={{
          transition: 'all var(--transition-base)',
        }}
      />
      
      {status === 'success' && (
        <Text 
          style={{ 
            color: 'var(--success-600)',
            fontSize: '12px',
            marginTop: '8px',
            display: 'block',
            textAlign: 'center'
          }}
        >
          ✅ 完成
        </Text>
      )}
      
      {status === 'exception' && (
        <Text 
          style={{ 
            color: 'var(--error-600)',
            fontSize: '12px',
            marginTop: '8px',
            display: 'block',
            textAlign: 'center'
          }}
        >
          ❌ 失败
        </Text>
      )}
    </div>
  );
};

// 预设的进度状态组件
export const UploadProgress: React.FC<{ 
  percent: number; 
  fileName?: string; 
  status?: 'uploading' | 'processing' | 'completed' | 'error' 
}> = ({ 
  percent, 
  fileName, 
  status = 'uploading' 
}) => {
  const getStatusText = () => {
    switch (status) {
      case 'uploading': return '正在上传...';
      case 'processing': return '正在处理...';
      case 'completed': return '处理完成';
      case 'error': return '处理失败';
      default: return '';
    }
  };

  const getProgressStatus = (): 'normal' | 'active' | 'success' | 'exception' => {
    switch (status) {
      case 'uploading': return 'active';
      case 'processing': return 'active';
      case 'completed': return 'success';
      case 'error': return 'exception';
      default: return 'normal';
    }
  };

  return (
    <ProgressIndicator
      percent={percent}
      status={getProgressStatus()}
      text={fileName ? `${fileName} - ${getStatusText()}` : getStatusText()}
      theme="gradient"
      size="default"
    />
  );
};

// 数据统计进度组件
export const StatsProgress: React.FC<{
  label: string;
  current: number;
  total: number;
  type?: 'candidates' | 'processed' | 'matched';
}> = ({ label, current, total, type = 'candidates' }) => {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  
  const getIcon = () => {
    switch (type) {
      case 'candidates': return '👥';
      case 'processed': return '⚡';
      case 'matched': return '✨';
      default: return '📊';
    }
  };

  return (
    <ProgressIndicator
      percent={percent}
      text={`${getIcon()} ${label}: ${current}/${total}`}
      theme="glass"
      size="small"
      type="line"
    />
  );
};

export default ProgressIndicator;
