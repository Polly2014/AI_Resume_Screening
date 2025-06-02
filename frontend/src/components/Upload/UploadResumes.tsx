// 简历上传组件
import React, { useState, useCallback } from 'react';
import {
  Card,
  Upload,
  Button,
  List,
  Progress,
  Alert,
  Space,
  Typography,
  Badge,
  Divider,
  Row,
  Col,
} from 'antd';
import { 
  InboxOutlined, 
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined 
} from '@ant-design/icons';
import { resumeAPI } from '../../services/api';
import { UploadItem, UploadResponse } from '../../types';
import { useNotifications } from '../../context/AppContext';
import useResponsive from '../../hooks/useResponsive';
import ProgressIndicator from '../Common/ProgressIndicator';

const { Dragger } = Upload;
const { Text } = Typography;

const UploadResumes: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadList, setUploadList] = useState<UploadItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');

  // 使用全局状态
  const { addNotification } = useNotifications();
  const { isMobile } = useResponsive();

  const handleUpload = useCallback(async (files: File[]) => {
    setUploading(true);
    setUploadProgress(0);
    
    console.log("开始上传文件:", files.length, "个文件");
    console.log("文件列表:", files.map(f => f.name));
    
    // 设置上传超时
    const uploadTimeoutId = setTimeout(() => {
      if (uploading) {
        console.error("上传超时");
        setCurrentFile('上传超时，请检查网络连接');
        setUploadProgress(0);
        
        // 更新上传列表状态
        setUploadList(prev => prev.map(item => ({
          ...item,
          status: 'error' as const,
          error: '上传超时，请重试'
        })));
        
        addNotification({
          type: 'error',
          message: '上传超时：请检查网络连接或服务器状态后重试'
        });
        
        setUploading(false);
      }
    }, 60000); // 60秒超时，给予更多时间处理大文件
    
    try {
      // 模拟上传进度
      setCurrentFile('准备上传文件...');
      setUploadProgress(10);
      
      // 更新上传列表为上传中状态
      setUploadList(prev => prev.map(item => ({
        ...item,
        status: 'uploading' as const
      })));
      
      setCurrentFile('正在上传文件到服务器...');
      setUploadProgress(30);
      
      console.log("开始调用API上传文件");
      const response = await resumeAPI.uploadResumes(files);
      console.log("上传API调用成功:", response?.data);
      const result = response?.data as UploadResponse;
      
      setCurrentFile('正在处理文件...');
      setUploadProgress(70);
      
      // 等待一小段时间让用户看到进度
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentFile('上传完成！所有文件已成功处理');
      setUploadProgress(100);
      
      // 更新上传列表状态
      setUploadList(prev => prev.map(item => ({
        ...item,
        status: 'done' as const,
        response: result
      })));

      // 显示成功通知
      if (result.failed_files.length === 0) {
        addNotification({
          type: 'success',
          message: `上传成功！成功处理了 ${result.uploaded_files.length} 个简历文件，系统正在后台解析简历内容。`
        });
      } else {
        addNotification({
          type: 'warning',
          message: `上传完成：成功 ${result.uploaded_files.length} 个，失败 ${result.failed_files.length} 个`
        });
      }
      
      // 清除超时计时器
      clearTimeout(uploadTimeoutId);
    } catch (error: any) {
      setCurrentFile('上传失败');
      setUploadProgress(0);
      
      // 更新上传列表状态
      setUploadList(prev => prev.map(item => ({
        ...item,
        status: 'error' as const,
        error: '上传失败'
      })));
      
      // 只显示一个错误通知
      addNotification({
        type: 'error',
        message: `上传失败：${error?.response?.data?.detail || '网络错误或服务器异常，请稍后重试'}`
      });
      
      // 清除超时计时器
      clearTimeout(uploadTimeoutId);
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setCurrentFile('');
      }, 2000);
    }
  }, [addNotification, uploading]);

  const handleBeforeUpload = useCallback((file: File, fileList: File[]) => {
    console.log(`处理文件上传前: ${file.name}`, fileList.length);
    
    // 检查文件类型
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!validTypes.includes(file.type)) {
      console.warn(`文件类型不支持: ${file.name}, 类型: ${file.type}`);
      addNotification({
        type: 'error',
        message: `${file.name} 不是支持的文件格式`
      });
      return false;
    }

    // 检查文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.warn(`文件过大: ${file.name}, 大小: ${file.size} bytes`);
      addNotification({
        type: 'error',
        message: `${file.name} 文件大小超过 10MB`
      });
      return false;
    }

    // 添加到上传列表
    const newItem: UploadItem = {
      uid: (file as any).uid || Date.now().toString(),
      name: file.name,
      status: 'uploading'
    };

    setUploadList(prev => [...prev, newItem]);
    
    return false; // 阻止自动上传
  }, [addNotification]);

  const uploadProps = {
    name: 'files',
    multiple: true,
    accept: '.pdf,.doc,.docx',
    beforeUpload: handleBeforeUpload,
    onChange: (info: any) => {
      console.log("Upload onChange 触发:", info);
      
      // 当文件选择完成且有文件时，自动开始上传
      if (info.fileList && info.fileList.length > 0) {
        const files = info.fileList
          .filter((file: any) => file.originFileObj)
          .map((file: any) => file.originFileObj);
        
        if (files.length > 0) {
          console.log("自动开始上传", files.length, "个文件");
          setTimeout(() => {
            handleUpload(files);
          }, 100); // 小延迟确保状态正确设置
        }
      }
    },
  };

  const handleStartUpload = useCallback(() => {
    console.log("开始上传流程");
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx';
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      console.log(`选择了 ${files.length} 个文件:`, files.map(f => f.name));
      
      if (files.length > 0) {
        handleUpload(files);
      }
    };
    
    input.click();
  }, [handleUpload]);

  const clearList = useCallback(() => {
    setUploadList([]);
  }, []);

  return (
    <div className="upload-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileTextOutlined style={{ color: 'var(--primary-500)' }} />
                <span className="gradient-text">简历批量上传</span>
              </div>
            }
            style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--gray-200)'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Alert
                message="支持的文件格式"
                description="支持 PDF、DOC、DOCX 格式的简历文件，单个文件最大 10MB。上传后系统会自动解析简历内容并提取候选人信息。"
                type="info"
                showIcon
                style={{
                  borderRadius: 'var(--radius-base)',
                  background: 'var(--primary-50)',
                  border: '1px solid var(--primary-200)'
                }}
              />

              {/* 上传进度显示 */}
              {uploading && (
                  <Card 
                  size="small" 
                  className="upload-progress-card"
                  style={{ 
                    backgroundColor: 'var(--success-50)', 
                    border: '1px solid var(--success-200)',
                    borderRadius: 'var(--radius-base)',
                    animation: uploading ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ProgressIndicator size="small" theme="gradient" />
                      <Text strong style={{ color: 'var(--success-700)' }}>{currentFile || '正在处理文件...'}</Text>
                    </div>
                    <Progress 
                      percent={uploadProgress} 
                      status={uploadProgress < 100 ? "active" : "success"} 
                      strokeColor="var(--gradient-primary)"
                      showInfo={true}
                      style={{ marginBottom: 0 }}
                    />
                  </Space>
                </Card>
              )}

              <Dragger
                {...uploadProps}
                style={{ 
                  padding: isMobile ? '30px 15px' : '40px 20px',
                  borderRadius: 'var(--radius-lg)',
                  borderColor: 'var(--primary-300)',
                  background: 'var(--gray-50)'
                }}
                disabled={uploading}
                className="modern-dragger"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: 'var(--primary-500)', fontSize: isMobile ? '36px' : '48px' }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                  点击或拖拽文件到此区域上传
                </p>
                <p className="ant-upload-hint" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  支持批量上传，系统将自动解析简历内容并提取候选人信息
                </p>
              </Dragger>

              <Row gutter={[16, 16]} justify="center">
                <Col xs={24} sm={8}>
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={handleStartUpload}
                    loading={uploading}
                    size={isMobile ? 'middle' : 'large'}
                    block
                  >
                    选择文件上传
                  </Button>
                </Col>
                
                {uploadList.length > 0 && (
                  <Col xs={24} sm={8}>
                    <Button 
                      onClick={clearList} 
                      disabled={uploading}
                      size={isMobile ? 'middle' : 'large'}
                      block
                    >
                      清空列表
                    </Button>
                  </Col>
                )}
              </Row>

              {uploadList.length > 0 && (
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>上传列表</span>
                      <Badge count={uploadList.length} style={{ backgroundColor: 'var(--success-500)' }} />
                    </div>
                  } 
                  size="small"
                  className="upload-list-card"
                  style={{
                    borderRadius: 'var(--radius-base)',
                    border: '1px solid var(--gray-200)'
                  }}
                >
                  <List
                    dataSource={uploadList}
                    size={isMobile ? 'small' : 'default'}
                    renderItem={(item) => (
                      <List.Item style={{ padding: isMobile ? '8px 0' : '12px 0' }}>
                        <List.Item.Meta
                          avatar={
                            item.status === 'uploading' ? (
                              <ProgressIndicator size="small" theme="default" />
                            ) : item.status === 'done' ? (
                              <CheckCircleOutlined style={{ color: 'var(--success-500)', fontSize: '18px' }} />
                            ) : (
                              <ExclamationCircleOutlined style={{ color: 'var(--error-500)', fontSize: '18px' }} />
                            )
                          }
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: isMobile ? '13px' : '14px' }}>{item.name}</span>
                              {item.status === 'done' && (
                                <Badge status="success" text="完成" />
                              )}
                              {item.status === 'error' && (
                                <Badge status="error" text="失败" />
                              )}
                              {item.status === 'uploading' && (
                                <Badge status="processing" text="上传中" />
                              )}
                            </div>
                          }
                          description={
                            <div>                              {item.status === 'uploading' && (
                                <div>
                                  <Progress 
                                    percent={uploadProgress > 0 ? uploadProgress : 5} 
                                    size="small" 
                                    showInfo={false}
                                    strokeColor="var(--gradient-primary)"
                                    status="active"
                                  />
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {uploading ? currentFile || '正在上传和处理文件...' : '等待上传...'}
                                  </Text>
                                </div>
                              )}
                              {item.status === 'done' && item.response && (
                                <div>
                                  <Text type="success" style={{ fontSize: '12px' }}>
                                    ✅ 上传成功，已添加到候选人库
                                  </Text>
                                  {item.response.uploaded_files && item.response.uploaded_files.length > 0 && (
                                    <div style={{ marginTop: 4 }}>
                                      <Text type="secondary" style={{ fontSize: '11px' }}>
                                        创建了 {item.response.uploaded_files.length} 个候选人记录
                                      </Text>
                                    </div>
                                  )}
                                </div>
                              )}
                              {item.status === 'error' && (
                                <div>
                                  <Text type="danger" style={{ fontSize: '12px' }}>
                                    ❌ {item.error || '上传失败'}
                                  </Text>
                                  <br />
                                  <Space>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                      请检查文件格式和网络连接
                                    </Text>
                                    <Button 
                                      type="link" 
                                      size="small" 
                                      onClick={() => {
                                        // 查找这个文件并重新上传
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = '.pdf,.doc,.docx';
                                        input.onchange = (e) => {
                                          const files = Array.from((e.target as HTMLInputElement).files || []);
                                          if (files.length > 0) {
                                            // 移除失败的项目
                                            setUploadList(prev => prev.filter(i => i.uid !== item.uid));
                                            // 重新上传
                                            handleUpload(files);
                                          }
                                        };
                                        input.click();
                                      }}
                                      style={{ padding: '0 4px', height: 'auto', fontSize: '11px' }}
                                    >
                                      重试
                                    </Button>
                                  </Space>
                                </div>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  <div style={{ textAlign: 'center' }}>
                    <Space>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        成功: {uploadList.filter(item => item.status === 'done').length} |
                        失败: {uploadList.filter(item => item.status === 'error').length} |
                        总计: {uploadList.length}
                      </Text>
                    </Space>
                  </div>
                </Card>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UploadResumes;
