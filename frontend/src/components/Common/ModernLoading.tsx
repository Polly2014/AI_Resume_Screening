// 现代化加载组件
import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export interface ModernLoadingProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
}

const ModernLoading: React.FC<ModernLoadingProps> = ({ 
  size = 'default', 
  tip, 
  spinning = true,
  children 
}) => {
  const antIcon = (
    <LoadingOutlined 
      style={{ 
        fontSize: size === 'large' ? 32 : size === 'small' ? 16 : 24,
        color: 'var(--primary-500)'
      }} 
      spin 
    />
  );

  if (children) {
    return (
      <Spin 
        indicator={antIcon} 
        tip={tip} 
        spinning={spinning}
        style={{
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {children}
      </Spin>
    );
  }

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        minHeight: '200px'
      }}
    >
      <Spin indicator={antIcon} />
      {tip && (
        <div 
          style={{
            marginTop: '16px',
            color: 'var(--gray-600)',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {tip}
        </div>
      )}
    </div>
  );
};

export default ModernLoading;
