// 统计卡片组件
import React from 'react';
import { Card } from 'antd';
import useResponsive from '../../hooks/useResponsive';

export interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = '#4263eb',
  trend 
}) => {
  const { isMobile } = useResponsive();
  
  return (
    <Card
      className="stats-card stats-card-enhanced"
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(230, 230, 230, 0.5)',
        transition: 'all var(--transition-base)',
        position: 'relative',
        overflow: 'hidden',
        height: isMobile ? '110px' : '130px',
        boxShadow: 'rgba(0, 0, 0, 0.03) 0px 3px 8px',
        backdropFilter: 'blur(20px)'
      }}
      styles={{
        body: { 
          padding: isMobile ? '10px' : '14px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }
      }}
    >
      {/* 装饰性渐变条 */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${color}, ${color}88)`
        }}
      />
      
      {/* 背景装饰 */}
      <div 
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '120px',
          height: '120px',
          background: `${color}08`,
          borderRadius: '50%',
          zIndex: 0,
          filter: 'blur(15px)'
        }}
      />
      
      <div 
        style={{
          position: 'absolute',
          bottom: '-10px',
          left: '-10px',
          width: '70px',
          height: '70px',
          background: `${color}05`,
          borderRadius: '50%',
          zIndex: 0,
          filter: 'blur(10px)'
        }}
      />
      
      {/* 装饰性线条 */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '22px',
          width: '60px',
          height: '30px',
          opacity: 0.2,
          zIndex: 0,
          borderBottom: `2px solid ${color}`,
          borderRight: `2px solid ${color}`
        }}
      />
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between', 
        height: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ flex: 1 }}>
          <div 
            style={{ 
              fontSize: isMobile ? '12px' : '13px', 
              color: 'var(--gray-600)', 
              marginBottom: isMobile ? '4px' : '8px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: color,
                display: 'inline-block'
              }}
            />
            {title}
          </div>
          <div 
            className="stats-number"
            style={{
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: '800',
              background: `linear-gradient(135deg, ${color}, ${color}aa)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
              marginBottom: isMobile ? '4px' : '8px',
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {value}
          </div>
          {trend && (
            <div 
              style={{ 
                fontSize: isMobile ? '10px' : '12px', 
                color: trend.isPositive ? 'var(--success-600)' : 'var(--error-600)',
                fontWeight: '600',
                alignItems: 'center',
                gap: '2px',
                background: trend.isPositive ? 'var(--success-50)' : 'var(--error-50)',
                padding: isMobile ? '1px 6px' : '2px 10px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                marginTop: isMobile ? '2px' : '6px',
                boxShadow: trend.isPositive ? 
                  'rgba(16, 185, 129, 0.1) 0px 1px 3px' : 
                  'rgba(239, 68, 68, 0.1) 0px 1px 3px'
              }}
            >
              <span style={{ fontSize: isMobile ? '12px' : '14px' }}>
                {trend.isPositive ? '↗' : '↘'}
              </span>
              {Math.abs(trend.value)}% {trend.isPositive ? '增长' : '下降'}
            </div>
          )}
        </div>
        {icon && (
          <div 
            style={{ 
              fontSize: isMobile ? '18px' : '24px', 
              color: 'white',
              marginTop: '4px',
              padding: isMobile ? '6px' : '8px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${color}, ${color}aa)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 10px ${color}33`
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;
