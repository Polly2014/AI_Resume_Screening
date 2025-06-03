import React, { useState, useEffect } from 'react';
import { Modal, Spin, Alert, Button, Space, Empty } from 'antd';
import { FilePdfOutlined, DownloadOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons';

interface PDFPreviewProps {
  visible: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName?: string;
  title?: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({
  visible,
  onClose,
  pdfUrl,
  fileName = '简历预览',
  title = '简历预览'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 重置状态当模态框打开时
  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(null);
    }
  }, [visible, pdfUrl]);

  // 处理iframe加载完成
  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  // 处理iframe加载错误
  const handleIframeError = () => {
    setLoading(false);
    setError('PDF文件加载失败，可能文件不存在或格式不支持');
  };

  // 下载PDF
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 在新窗口打开PDF
  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const modalFooter = (
    <Space>
      <Button 
        icon={<DownloadOutlined />} 
        onClick={handleDownload}
        type="primary"
      >
        下载
      </Button>
      <Button 
        icon={<EyeOutlined />} 
        onClick={handleOpenInNewTab}
      >
        新窗口打开
      </Button>
      <Button 
        icon={<CloseOutlined />} 
        onClick={onClose}
      >
        关闭
      </Button>
    </Space>
  );

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FilePdfOutlined style={{ color: 'var(--error-500)' }} />
          <span className="gradient-text">{title}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={modalFooter}
      width="90%"
      style={{ 
        top: 20,
        maxWidth: '1200px'
      }}
      styles={{
        body: {
          padding: 0,
          height: '80vh',
          position: 'relative'
        }
      }}
      destroyOnHidden
    >
      <div style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        backgroundColor: '#f5f5f5'
      }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              正在加载PDF文件...
            </div>
          </div>
        )}

        {error ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            zIndex: 10
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical">
                  <Alert
                    message="PDF预览失败"
                    description={error}
                    type="error"
                    showIcon
                  />
                  <Button type="primary" onClick={handleDownload}>
                    <DownloadOutlined /> 下载文件查看
                  </Button>
                </Space>
              }
            />
          </div>
        ) : (
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
            width="100%"
            height="100%"
            style={{
              border: 'none',
              borderRadius: '0 0 8px 8px'
            }}
            title={fileName}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
      </div>
    </Modal>
  );
};

export default PDFPreview;
