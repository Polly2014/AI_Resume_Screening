// 主布局组件
import React, { useState } from 'react';
import { Layout, MenuProps } from 'antd';
import { 
  UserOutlined, 
  UploadOutlined, 
  FilterOutlined
} from '@ant-design/icons';
import CandidatesList from '../Candidates/CandidatesList';
import UploadResumes from '../Upload/UploadResumes';
import FilterPanel from '../Filters/FilterPanel';
import ResponsiveMenu from '../Common/ResponsiveMenu';
import useResponsive from '../../hooks/useResponsive';

const { Content, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const menuItems: MenuItem[] = [
  getItem('人才库', 'candidates', <UserOutlined />),
  getItem('简历上传', 'upload', <UploadOutlined />),
  getItem('智能筛选', 'filter', <FilterOutlined />),
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('candidates');
  const { isMobile } = useResponsive();

  const renderContent = () => {
    switch (selectedKey) {
      case 'candidates':
        return <CandidatesList />;
      case 'upload':
        return <UploadResumes />;
      case 'filter':
        return <FilterPanel />;
      default:
        return <CandidatesList />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }} className="page-transition">
      {!isMobile && (
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          style={{
            background: 'var(--gradient-sidebar)',
            boxShadow: 'var(--shadow-lg)',
            borderRight: '1px solid var(--border-primary)'
          }}
        >
          <div 
            className="logo" 
            style={{
              height: '64px',
              margin: '16px',
              background: 'var(--glass-bg)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              fontSize: collapsed ? '16px' : '18px',
              fontWeight: '700',
              transition: 'all var(--transition-slow)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-secondary)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {collapsed ? 'HR' : 'HR Copilot v2'}
          </div>
          <ResponsiveMenu
            menuItems={menuItems}
            selectedKey={selectedKey}
            onMenuClick={setSelectedKey}
            isMobile={false}
          />
        </Sider>
      )}
      <Layout className="site-layout">
        <Content style={{ 
          margin: isMobile ? '0 8px' : '0 16px', 
          padding: isMobile ? '16px' : '32px', 
          paddingTop: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* 移动设备菜单 */}
          {isMobile && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <ResponsiveMenu
                menuItems={menuItems}
                selectedKey={selectedKey}
                onMenuClick={setSelectedKey}
                isMobile={true}
              />
            </div>
          )}
          {/* 装饰性背景元素 */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: 'var(--gradient-accent)',
              borderRadius: '50%',
              opacity: 0.03,
              transform: 'translate(50%, -50%)',
              pointerEvents: 'none'
            }}
          />
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '150px',
              height: '150px',
              background: 'var(--gradient-accent)',
              borderRadius: '50%',
              opacity: 0.03,
              transform: 'translate(-50%, 50%)',
              pointerEvents: 'none'
            }}
          />
          
          {/* 装饰线条 */}
          <div style={{
            position: 'absolute',
            top: '50px',
            right: '50px',
            width: '80px',
            height: '80px',
            border: '2px solid var(--primary-200)',
            borderRadius: 'var(--radius-lg)',
            opacity: 0.4,
            pointerEvents: 'none'
          }}></div>
          
          <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '40px',
            width: '60px',
            height: '60px',
            border: '2px solid var(--primary-200)',
            borderRadius: 'var(--radius-full)',
            opacity: 0.3,
            pointerEvents: 'none'
          }}></div>
          
          {/* 内容容器 */}
          <div 
            className="content-wrapper"
            style={{
              position: 'relative',
              zIndex: 1,
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: isMobile ? '16px' : '24px',
              minHeight: 'calc(100vh - 128px)',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
