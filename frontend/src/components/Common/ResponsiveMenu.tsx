import React, { useState } from 'react';
import { Drawer, Button, Menu } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

interface ResponsiveMenuProps {
  menuItems: MenuProps['items'];
  selectedKey: string;
  onMenuClick: (key: string) => void;
  isMobile?: boolean;
}

const ResponsiveMenu: React.FC<ResponsiveMenuProps> = ({
  menuItems,
  selectedKey,
  onMenuClick,
  isMobile = false
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleMenuClick = ({ key }: { key: string }) => {
    onMenuClick(key);
    if (isMobile) {
      setDrawerVisible(false);
    }
  };

  if (isMobile) {
    return (
      <>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerVisible(true)}
          style={{
            color: 'var(--text-primary)',
            fontSize: '18px',
          }}
        />
        <Drawer
          title={
            <div style={{ 
              color: 'var(--primary-600)', 
              fontWeight: 'bold',
              fontSize: '18px' 
            }}>
              导航菜单
            </div>
          }
          placement="left"
          closable={true}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={280}
          styles={{
            body: { padding: 0 },
            header: { 
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)'
            }
          }}
        >
          <Menu
            selectedKeys={[selectedKey]}
            mode="inline"
            items={menuItems}
            onClick={handleMenuClick}
            style={{
              border: 'none',
              background: 'var(--bg-secondary)',
              height: '100%'
            }}
          />
        </Drawer>
      </>
    );
  }

  return (
    <Menu
      selectedKeys={[selectedKey]}
      mode="inline"
      items={menuItems}
      onClick={handleMenuClick}
      style={{
        background: 'transparent',
        border: 'none'
      }}
    />
  );
};

export default ResponsiveMenu;
