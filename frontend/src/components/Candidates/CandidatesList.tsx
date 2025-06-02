// 候选人列表组件
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  Card,
  Descriptions,
  Tabs,
  Empty,
  Row,
  Col,
  TableProps
} from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, UserOutlined, ReloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { candidateAPI, resumeAPI } from '../../services/api';
import { Candidate, Resume, STATUS_LABELS } from '../../types';
import AdvancedSearch, { SearchFilters } from '../Common/AdvancedSearch';
import StatsCard from '../Common/StatsCard';
import StatusBadge from '../Common/StatusBadge';
import ProgressIndicator from '../Common/ProgressIndicator';
import PDFPreview from '../Common/PDFPreview';
import { useNotifications } from '../../context/AppContext';
import useResponsive from '../../hooks/useResponsive';

// 为响应式设计定义断点类型
type BreakpointType = 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const CandidatesList: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [candidateModalVisible, setCandidateModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateResumes, setCandidateResumes] = useState<Resume[]>([]);
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    keyword: '',
    skills: [],
    experience: '',
    location: '',
    status: '',
    education: '',
    salary: '',
  });
  const [form] = Form.useForm();
  
  // 使用全局状态
  const { addNotification } = useNotifications();
  const { isMobile } = useResponsive();

  // 统计数据
  const stats = useMemo(() => {
    const total = candidates.length;
    const statusCounts = candidates.reduce((acc, candidate) => {
      acc[candidate.status] = (acc[candidate.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      pending: statusCounts['pending'] || 0,
      interviewed: statusCounts['interviewed'] || 0,
      rejected: statusCounts['rejected'] || 0,
      hired: statusCounts['hired'] || 0,
    };
  }, [candidates]);

  // 应用搜索过滤器
  const applyFilters = useCallback((filters: SearchFilters) => {
    let filtered = [...candidates];

    // 基础文本搜索
    if (filters.keyword) {
      const query = filters.keyword.toLowerCase();
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(query) ||
        candidate.email?.toLowerCase().includes(query) ||
        candidate.current_position?.toLowerCase().includes(query) ||
        candidate.current_company?.toLowerCase().includes(query) ||
        candidate.skills?.some(skill => skill.toLowerCase().includes(query))
      );
    }

    // 状态过滤
    if (filters.status) {
      filtered = filtered.filter(candidate => candidate.status === filters.status);
    }

    // 技能过滤
    if (filters.skills && filters.skills.length > 0) {
      filtered = filtered.filter(candidate => 
        candidate.skills?.some(skill => filters.skills.includes(skill))
      );
    }

    // 工作年限过滤
    if (filters.experience) {
      const [min, max] = filters.experience.split('-').map(Number);
      filtered = filtered.filter(candidate => {
        const exp = candidate.experience_years || 0;
        return exp >= min && (max ? exp <= max : true);
      });
    }

    setFilteredCandidates(filtered);
  }, [candidates]);

  // 处理搜索
  const handleSearch = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
    applyFilters(filters);
  }, [applyFilters]);

  // 获取候选人列表
  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await candidateAPI.getCandidates();
      setCandidates(response.data);
      setFilteredCandidates(response.data);
      addNotification({
        type: 'success',
        message: `候选人列表加载成功，共 ${response.data.length} 个候选人`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: '获取候选人列表失败，请检查网络连接后重试'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // 当候选人数据更新时，重新应用过滤器
  useEffect(() => {
    applyFilters(searchFilters);
  }, [candidates, searchFilters, applyFilters]);

  // 合并查看和编辑功能
  const handleViewOrEdit = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    form.setFieldsValue(candidate);
    setEditMode(false);
    try {
      const response = await resumeAPI.getCandidateResumes(candidate.id);
      setCandidateResumes(response.data);
    } catch (error) {
      addNotification({
        type: 'error',
        message: '获取简历信息失败'
      });
    }
    setCandidateModalVisible(true);
  };

  // 预览PDF简历
  const handlePdfPreview = async (candidate: Candidate) => {
    try {
      const response = await resumeAPI.getCandidateResumes(candidate.id);
      const pdfResumes = response.data.filter(resume => resume.file_type === 'pdf');
      
      if (pdfResumes.length === 0) {
        addNotification({
          type: 'warning',
          message: '该候选人没有PDF格式的简历'
        });
        return;
      }
      
      // 使用第一个PDF简历文件
      const firstPdfResume = pdfResumes[0];
      const pdfUrl = `http://localhost:8000/api/resumes/${firstPdfResume.id}/download`;
      
      setPdfUrl(pdfUrl);
      setPdfFileName(firstPdfResume.filename);
      setPdfPreviewVisible(true);
    } catch (error) {
      addNotification({
        type: 'error',
        message: '获取简历文件失败'
      });
    }
  };

  // 更新候选人
  const handleUpdate = async (values: any) => {
    if (!selectedCandidate) return;
    
    try {
      await candidateAPI.updateCandidate(selectedCandidate.id, values);
      addNotification({
        type: 'success',
        message: '候选人信息更新成功'
      });
      setEditMode(false);
      fetchCandidates();
    } catch (error) {
      addNotification({
        type: 'error',
        message: '更新失败，请重试'
      });
    }
  };

  // 更新候选人状态
  const handleStatusChange = async (candidateId: number, status: string) => {
    try {
      await candidateAPI.updateCandidateStatus(candidateId, status);
      addNotification({
        type: 'success',
        message: '状态更新成功'
      });
      fetchCandidates();
    } catch (error) {
      addNotification({
        type: 'error',
        message: '状态更新失败'
      });
    }
  };

  // 删除候选人
  const handleDelete = async (candidateId: number) => {
    try {
      await candidateAPI.deleteCandidate(candidateId);
      addNotification({
        type: 'success',
        message: '候选人删除成功'
      });
      fetchCandidates();
    } catch (error) {
      addNotification({
        type: 'error',
        message: '删除失败，请重试'
      });
    }
  };

  const getColumns = () => {
    const baseColumns: TableProps<Candidate>['columns'] = [
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        fixed: isMobile ? 'left' as const : undefined,
      },
      {
        title: '邮箱',
        dataIndex: 'email',
        key: 'email',
        width: 200,
        responsive: ['md' as BreakpointType],
      },
      {
        title: '当前职位',
        dataIndex: 'current_position',
        key: 'current_position',
        width: 150,
        responsive: ['sm' as BreakpointType],
      },
      {
        title: '当前公司',
        dataIndex: 'current_company',
        key: 'current_company',
        width: 150,
        responsive: ['lg' as BreakpointType],
      },
      {
        title: '工作年限',
        dataIndex: 'experience_years',
        key: 'experience_years',
        width: 100,
        render: (years: number) => years ? `${years}年` : '-',
      },
      {
        title: '技能',
        dataIndex: 'skills',
        key: 'skills',
        width: 200,
        responsive: ['md' as BreakpointType],
        render: (skills: string[]) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {skills?.slice(0, 3).map(skill => (
              <span key={skill} className="skill-tag">
                {skill}
              </span>
            ))}
            {skills && skills.length > 3 && (
              <span className="skill-tag" style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}>
                +{skills.length - 3}
              </span>
            )}
          </div>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: string, record: Candidate) => (
          <Select
            size="small"
            value={status}
            style={{ width: '100%', minWidth: '120px' }}
            onChange={(value) => handleStatusChange(record.id, value)}
            dropdownMatchSelectWidth={false}
            listHeight={200}
            dropdownStyle={{ 
              minWidth: '160px',
              maxHeight: '200px'
            }}
            getPopupContainer={(triggerNode) => triggerNode.parentElement}
          >
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <Option key={key} value={key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span 
                    className={`status-badge status-${key}`}
                    style={{ 
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {label}
                  </span>
                </div>
              </Option>
            ))}
          </Select>
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: isMobile ? 80 : 150,
        fixed: 'right' as const,
        render: (_: any, record: Candidate) => (
          <Space size={isMobile ? "small" : "middle"}>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewOrEdit(record)}
              className="action-button-ghost"
              size={isMobile ? "small" : "middle"}
              style={{
                border: '1px solid var(--primary-300)',
                borderRadius: 'var(--radius-base)',
                padding: isMobile ? '2px 4px' : '4px 8px'
              }}
            />
            {!isMobile && (
              <Button
                type="link"
                icon={<FilePdfOutlined />}
                onClick={() => handlePdfPreview(record)}
                className="action-button-ghost"
                size={isMobile ? "small" : "middle"}
                style={{
                  border: '1px solid var(--success-300)',
                  borderRadius: 'var(--radius-base)',
                  padding: isMobile ? '2px 4px' : '4px 8px',
                  color: 'var(--success-600)'
                }}
              />
            )}
            <Popconfirm
              title="确定删除这个候选人吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                type="link" 
                danger 
                icon={<DeleteOutlined />}
                size={isMobile ? "small" : "middle"}
                style={{
                  border: '1px solid var(--error-300)',
                  borderRadius: 'var(--radius-base)',
                  padding: isMobile ? '2px 4px' : '4px 8px'
                }}
              />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    // 移动端显示更少的列
    if (isMobile) {
      return [
        baseColumns[0], // 姓名
        baseColumns[4], // 工作年限 
        baseColumns[6], // 状态
        baseColumns[7], // 操作
      ];
    }

    return baseColumns;
  };

  const columns = getColumns();

  return (
    <div className="candidates-list-container">
      {/* 统计卡片 */}
      <Card
        className="stats-overview-card glass-card"
        style={{
          marginBottom: '32px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-md)',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(15px)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* 背景装饰 */}
        <div 
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '280px',
            height: '280px',
            background: 'linear-gradient(135deg, var(--primary-100), var(--gray-100))',
            borderRadius: '50%',
            opacity: 0.5,
            zIndex: 0,
            filter: 'blur(40px)'
          }}
        />
        <div 
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '240px',
            height: '240px',
            background: 'linear-gradient(225deg, var(--gray-200), var(--primary-50))',
            borderRadius: '50%',
            opacity: 0.4,
            zIndex: 0,
            filter: 'blur(30px)'
          }}
        />
        
        {/* 装饰性线条 */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'linear-gradient(90deg, var(--primary-300), var(--info), var(--success), var(--primary-300))',
            opacity: 0.7,
            zIndex: 2
          }}
        />
        
        {/* 标题栏 */}
        <div style={{ 
          padding: isMobile ? '20px 16px 4px' : '24px 28px 4px',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          marginBottom: isMobile ? '16px' : '20px',
          borderBottom: '1px solid rgba(230, 230, 230, 0.4)',
          paddingBottom: isMobile ? '16px' : '20px',
          gap: isMobile ? '12px' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
            <div style={{
              width: isMobile ? '36px' : '48px',
              height: isMobile ? '36px' : '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid rgba(255, 255, 255, 0.8)'
            }}>
              <UserOutlined style={{ fontSize: isMobile ? '18px' : '24px', color: 'var(--primary-600)' }} />
            </div>
            <div>
              <h2 style={{ 
                fontSize: isMobile ? '18px' : '22px', 
                fontWeight: '700', 
                margin: 0,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '8px' : '12px',
                letterSpacing: '-0.3px',
                flexWrap: 'wrap'
              }}>
                人才库概览
                <Tag 
                  color="blue" 
                  style={{ 
                    marginLeft: isMobile ? '4px' : '8px', 
                    fontWeight: '500', 
                    fontSize: '12px', 
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #4096ff, #1677ff)',
                    border: 'none',
                    padding: '0 10px',
                    height: '22px',
                    lineHeight: '22px',
                    boxShadow: '0 2px 6px rgba(22, 119, 255, 0.2)'
                  }}
                >
                  今日新增 +5
                </Tag>
              </h2>
              <div style={{ 
                fontSize: isMobile ? '12px' : '14px', 
                color: 'var(--text-secondary)',
                marginTop: isMobile ? '4px' : '6px',
                maxWidth: isMobile ? '100%' : '600px',
                lineHeight: '1.5'
              }}>
                全面了解人才招聘流程中各阶段的候选人分布，帮助您更高效地进行人才决策
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Select 
              defaultValue="week" 
              style={{ width: 110 }}
              bordered={false}
              size={isMobile ? 'small' : 'middle'}
              options={[
                { value: 'today', label: '今日' },
                { value: 'week', label: '本周' },
                { value: 'month', label: '本月' },
                { value: 'quarter', label: '本季度' }
              ]}
              dropdownStyle={{ borderRadius: 'var(--radius-lg)' }}
            />
          </div>
        </div>
        
        <div className="stats-cards-container" style={{ padding: '0 24px 28px', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            display: 'flex', 
            flexWrap: isMobile ? 'wrap' : 'nowrap', 
            gap: isMobile ? '12px' : '8px',
            overflow: 'hidden'
          }}>
            <div style={{ flex: isMobile ? '0 0 calc(50% - 6px)' : 1 }}>
              <StatsCard
                title="总候选人"
                value={stats.total}
                icon={<UserOutlined />}
                color="#4263eb"
                trend={{ value: 12, isPositive: true }}
              />
            </div>
            <div style={{ flex: isMobile ? '0 0 calc(50% - 6px)' : 1 }}>
              <StatsCard
                title="待处理"
                value={stats.pending}
                icon={<UserOutlined />}
                color="#f59f00"
              />
            </div>
            <div style={{ flex: isMobile ? '0 0 calc(50% - 6px)' : 1 }}>
              <StatsCard
                title="已面试"
                value={stats.interviewed}
                icon={<UserOutlined />}
                color="#1c7ed6"
              />
            </div>
            <div style={{ flex: isMobile ? '0 0 calc(50% - 6px)' : 1 }}>
              <StatsCard
                title="已录用"
                value={stats.hired}
                icon={<UserOutlined />}
                color="#37b24d"
              />
            </div>
            <div style={{ flex: isMobile ? '0 0 calc(50% - 6px)' : 1 }}>
              <StatsCard
                title="已拒绝"
                value={stats.rejected}
                icon={<UserOutlined />}
                color="#e03131"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 搜索和过滤 */}
      <Card 
        className="search-card glass-card"
        style={{
          marginBottom: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-sm)',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(15px)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* 装饰元素 */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '3px',
            background: 'linear-gradient(90deg, var(--primary-300), var(--primary-400), var(--primary-300))',
            opacity: 0.7
          }}
        />
        
        <div 
          style={{
            position: 'absolute',
            bottom: '-50px',
            right: '-50px',
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, var(--primary-50), var(--gray-100))',
            borderRadius: '50%',
            opacity: 0.4,
            filter: 'blur(30px)',
            zIndex: 0
          }}
        />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AdvancedSearch
            onSearch={handleSearch}
            placeholder="搜索候选人姓名、邮箱、职位、公司或技能..."
            showFilters={true}
          />
        </div>
      </Card>

      {/* 候选人列表 */}
      <Card 
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            padding: '8px 0' 
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid rgba(255, 255, 255, 0.8)'
            }}>
              <UserOutlined style={{ fontSize: '18px', color: 'var(--primary-600)' }} />
            </div>
            <div>
              <span className="gradient-text" style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                letterSpacing: '-0.3px'
              }}>
                候选人列表
              </span>
              <Tag 
                color="blue" 
                style={{ 
                  marginLeft: '10px', 
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #4096ff40, #1677ff40)',
                  border: 'none',
                  color: '#1677ff',
                  fontWeight: '500'
                }}
              >
                {filteredCandidates.length}/{stats.total}
              </Tag>
            </div>
          </div>
        }
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={fetchCandidates}
            >
              {!isMobile && '刷新数据'}
            </Button>
          </Space>
        }
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-md)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(15px)',
          overflow: 'hidden',
          position: 'relative'
        }}
        className="candidate-list-card"
        headStyle={{
          borderBottom: '1px solid rgba(230, 230, 230, 0.6)',
          padding: '16px 24px'
        }}
        bodyStyle={{
          padding: '0',
          position: 'relative'
        }}
      >
        {/* 装饰背景 */}
        <div 
          style={{
            position: 'absolute',
            top: '-120px',
            left: '-120px',
            width: '300px',
            height: '300px',
            background: 'linear-gradient(135deg, var(--primary-50), var(--gray-50))',
            borderRadius: '50%',
            opacity: 0.4,
            filter: 'blur(60px)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <ProgressIndicator theme="gradient" size="large" />
            <div style={{ marginTop: '16px', color: 'var(--gray-600)' }}>
              正在加载候选人数据...
            </div>
          </div>
        )}
        
        {!loading && (
          <div style={{ position: 'relative', zIndex: 1, padding: '16px 24px 24px' }}>
            <Table
              columns={columns}
              dataSource={filteredCandidates}
              rowKey="id"
              pagination={{
                pageSize: isMobile ? 5 : 10,
                showSizeChanger: !isMobile,
                showQuickJumper: !isMobile,
                showTotal: (total, range) => 
                  isMobile ? `${range[0]}-${range[1]} / ${total}` : `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                size: isMobile ? 'small' : 'default',
                style: {
                  marginTop: '16px',
                  padding: '16px 0'
                }
              }}
              scroll={{ x: 1200 }}
              size={isMobile ? 'small' : 'middle'}
              style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden'
              }}
              rowClassName={() => 'candidate-table-row'}
            />
          </div>
        )}
      </Card>

      {/* 候选人详情/编辑模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editMode ? (
              <EditOutlined style={{ color: 'var(--primary-500)' }} />
            ) : (
              <EyeOutlined style={{ color: 'var(--primary-500)' }} />
            )}
            <span className="gradient-text">
              {editMode ? '编辑候选人' : '候选人详情'}
            </span>
          </div>
        }
        open={candidateModalVisible}
        onCancel={() => {
          setCandidateModalVisible(false);
          setEditMode(false);
        }}
        footer={editMode ? (
          <Space>
            <Button 
              onClick={() => setEditMode(false)}
              type="default"
            >
              取消编辑
            </Button>
            <Button 
              type="primary" 
              onClick={() => form.submit()}
            >
              保存
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditMode(true)}
            >
              编辑候选人
            </Button>
          </Space>
        )}
        width={isMobile ? '95%' : 800}
        className="modern-modal"
        style={{
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {selectedCandidate && editMode ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            style={{ marginTop: '16px' }}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                  <Input placeholder="请输入姓名" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="邮箱" name="email" rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}>
                  <Input placeholder="请输入邮箱地址" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item label="电话" name="phone">
                  <Input placeholder="请输入电话号码" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="工作年限" name="experience_years">
                  <Input type="number" placeholder="请输入工作年限" min={0} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item label="当前职位" name="current_position">
                  <Input placeholder="请输入当前职位" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="当前公司" name="current_company">
                  <Input placeholder="请输入当前公司" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="教育背景" name="education">
              <Input placeholder="请输入教育背景" />
            </Form.Item>
            <Form.Item label="备注" name="notes">
              <TextArea rows={4} placeholder="请输入备注信息" />
            </Form.Item>
          </Form>
        ) : selectedCandidate ? (
          <div>
            <Tabs 
              defaultActiveKey="basic" 
              size={isMobile ? 'small' : 'middle'}
            >
              <TabPane tab="基本信息" key="basic">
                <Descriptions 
                  column={isMobile ? 1 : 2} 
                  size={isMobile ? 'small' : 'default'}
                  bordered
                  style={{ background: 'var(--gray-50)' }}
                >
                  <Descriptions.Item label="姓名">
                    <strong>{selectedCandidate.name}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="邮箱">
                    {selectedCandidate.email || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="电话">
                    {selectedCandidate.phone || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="教育背景">
                    {selectedCandidate.education || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="工作年限">
                    {selectedCandidate.experience_years ? `${selectedCandidate.experience_years}年` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="当前职位">
                    {selectedCandidate.current_position || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="当前公司">
                    {selectedCandidate.current_company || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <StatusBadge status={selectedCandidate.status} />
                  </Descriptions.Item>
                  <Descriptions.Item label="技能" span={isMobile ? 1 : 2}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {selectedCandidate.skills?.map(skill => (
                        <Tag key={skill} color="blue">{skill}</Tag>
                      )) || '-'}
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="备注" span={isMobile ? 1 : 2}>
                    {selectedCandidate.notes || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </TabPane>
              <TabPane tab="简历信息" key="resumes">
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {candidateResumes.length > 0 ? (
                    candidateResumes.map(resume => (
                      <Card 
                        key={resume.id} 
                        size="small" 
                        style={{ 
                          marginBottom: 16,
                          borderRadius: 'var(--radius-base)',
                          border: '1px solid var(--gray-200)'
                        }}
                      >
                        <Descriptions size="small" column={isMobile ? 1 : 2}>
                          <Descriptions.Item label="文件名">
                            {resume.filename}
                          </Descriptions.Item>
                          <Descriptions.Item label="文件大小">
                            {(resume.file_size / 1024).toFixed(2)} KB
                          </Descriptions.Item>
                          <Descriptions.Item label="处理状态">
                            <Tag color={resume.processing_status === 'completed' ? 'green' : 'orange'}>
                              {resume.processing_status === 'completed' ? '已完成' : '处理中'}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="上传时间">
                            {new Date(resume.created_at).toLocaleString()}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    ))
                  ) : (
                    <Empty 
                      description="暂无简历信息"
                      style={{ padding: '40px 0' }}
                    />
                  )}
                </div>
              </TabPane>
            </Tabs>
          </div>
        ) : null}
      </Modal>

      {/* PDF预览组件 */}
      <PDFPreview
        visible={pdfPreviewVisible}
        onClose={() => setPdfPreviewVisible(false)}
        pdfUrl={pdfUrl}
        fileName={pdfFileName}
        title={selectedCandidate ? `${selectedCandidate.name} - 简历预览` : '简历预览'}
      />
    </div>
  );
};

export default CandidatesList;
