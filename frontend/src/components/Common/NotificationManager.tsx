import React, { useEffect } from 'react';
import { notification } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNotifications } from '../../context/AppContext';

const NotificationManager: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    // 显示新通知
    notifications.forEach((notif) => {
      const icon = {
        success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        warning: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      }[notif.type];

      api[notif.type]({
        message: getTitle(notif.type),
        description: notif.message,
        icon,
        duration: 4.5,
        placement: 'topRight',
        key: notif.id,
        onClose: () => removeNotification(notif.id),
        style: {
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        },
      });
    });
  }, [notifications, api, removeNotification]);

  const getTitle = (type: string) => {
    switch (type) {
      case 'success':
        return '成功';
      case 'error':
        return '错误';
      case 'warning':
        return '警告';
      case 'info':
        return '信息';
      default:
        return '通知';
    }
  };

  return contextHolder;
};

export default NotificationManager;
