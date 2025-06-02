import React from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './components/Layout/MainLayout';
import { AppProvider } from './context/AppContext';
import './App.css';
import './styles/theme.css';

// 自定义Ant Design主题配置
const themeConfig = {
  token: {
    colorPrimary: '#0ea5e9',
    borderRadius: 8,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      fontWeight: 500,
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 24,
    },
    Table: {
      borderRadiusLG: 12,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
  },
};

function App() {
  return (
    <AppProvider>
      <ConfigProvider locale={zhCN} theme={themeConfig}>
        <AntApp>
          <div className="App">
            <MainLayout />
          </div>
        </AntApp>
      </ConfigProvider>
    </AppProvider>
  );
}

export default App;
