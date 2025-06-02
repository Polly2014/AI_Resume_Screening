// 智能筛选面板组件
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Tag,
  Table,
  Alert,
  Tabs,
  Row,
  Col,
} from 'antd';
import { SearchOutlined, BulbOutlined, RobotOutlined, FilterOutlined } from '@ant-design/icons';
import { candidateAPI, filterAPI } from '../../services/api';
import { 
  Candidate, 
  FilterCriteria, 
  FilterSuggestions, 
  SmartMatchResponse,
  STATUS_LABELS, 
  STATUS_COLORS 
} from '../../types';
import { useNotifications } from '../../context/AppContext';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const FilterPanel: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [smartMatching, setSmartMatching] = useState(false);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [suggestions, setSuggestions] = useState<FilterSuggestions | null>(null);
  const [smartMatchResults, setSmartMatchResults] = useState<SmartMatchResponse | null>(null);
  const [jobRequirements, setJobRequirements] = useState('');

  // 使用全局状态
  const { addNotification } = useNotifications();

  // 获取筛选建议
  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await filterAPI.getFilterSuggestions();
      setSuggestions(response.data);
    } catch (error) {
      addNotification({
        type: 'error',
        message: '获取筛选建议失败'
      });
    }
  }, [addNotification]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // 传统筛选
  const handleFilter = async (values: FilterCriteria) => {
    setLoading(true);
    try {
      const response = await candidateAPI.filterCandidates(values);
      setFilteredCandidates(response.data.candidates);
      addNotification({
        type: 'success',
        message: `找到 ${response.data.candidates.length} 个匹配的候选人`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: '筛选失败，请检查筛选条件后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 智能匹配
  const handleSmartMatch = async () => {
    if (!jobRequirements.trim()) {
      addNotification({
        type: 'warning',
        message: '请输入职位要求'
      });
      return;
    }

    setSmartMatching(true);
    try {
      const response = await filterAPI.smartMatch(jobRequirements);
      setSmartMatchResults(response.data);
      // 移除弹窗显示，结果将在页面底部显示
    } catch (error) {
      addNotification({
        type: 'error',
        message: '智能匹配失败，请重试'
      });
    } finally {
      setSmartMatching(false);
    }
  };

  // 重置筛选
  const handleReset = () => {
    form.resetFields();
    setFilteredCandidates([]);
    setJobRequirements('');
    setSmartMatchResults(null);
  };

  const candidateColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '当前职位',
      dataIndex: 'current_position',
      key: 'current_position',
    },
    {
      title: '工作年限',
      dataIndex: 'experience_years',
      key: 'experience_years',
      render: (years: number) => years ? `${years}年` : '-',
    },
    {
      title: '技能',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills: string[]) => (
        <div>
          {skills?.slice(0, 3).map(skill => (
            <Tag key={skill}>{skill}</Tag>
          ))}
          {skills && skills.length > 3 && <Tag>+{skills.length - 3}</Tag>}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>
          {STATUS_LABELS[status]}
        </Tag>
      ),
    },
  ];

  const smartMatchColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '当前职位',
      dataIndex: 'current_position',
      key: 'current_position',
      width: 150,
    },
    {
      title: '当前公司',
      dataIndex: 'current_company',
      key: 'current_company',
      width: 150,
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
      render: (skills: string[]) => (
        <div>
          {skills?.slice(0, 2).map(skill => (
            <Tag key={skill} style={{ fontSize: '12px' }}>{skill}</Tag>
          ))}
          {skills && skills.length > 2 && <Tag style={{ fontSize: '12px' }}>+{skills.length - 2}</Tag>}
        </div>
      ),
    },
    {
      title: '匹配度',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score: number) => (
        <span style={{ 
          color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {score}分
        </span>
      ),
      sorter: (a: any, b: any) => b.score - a.score,
    },
    {
      title: '匹配理由',
      dataIndex: 'reasons',
      key: 'reasons',
      width: 250,
      render: (reasons: string[]) => (
        <div>
          {reasons.map((reason, index) => (
            <Tag key={index} color="green" style={{ marginBottom: 4, fontSize: '12px' }}>
              {reason}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '潜在问题',
      dataIndex: 'concerns',
      key: 'concerns',
      width: 250,
      render: (concerns: string[]) => (
        <div>
          {concerns.map((concern, index) => (
            <Tag key={index} color="orange" style={{ marginBottom: 4, fontSize: '12px' }}>
              {concern}
            </Tag>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Tabs 
        defaultActiveKey="traditional"
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          border: '1px solid var(--gray-200)'
        }}
      >
        <TabPane 
          tab={
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SearchOutlined />
              传统筛选
            </span>
          } 
          key="traditional"
        >
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FilterOutlined style={{ color: 'var(--primary-500)' }} />
                <span className="gradient-text">候选人筛选</span>
              </div>
            }
            style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--gray-200)'
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFilter}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="关键词搜索" name="keywords">
                    <Select
                      mode="tags"
                      placeholder="输入关键词，按回车添加"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="教育背景" name="education">
                    <Select placeholder="选择教育背景" allowClear>
                      {suggestions?.education_levels.map(level => (
                        <Option key={level} value={level}>{level}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="最少工作年限" name="min_experience">
                    <InputNumber
                      min={0}
                      max={50}
                      placeholder="最少年限"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="最多工作年限" name="max_experience">
                    <InputNumber
                      min={0}
                      max={50}
                      placeholder="最多年限"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="技能要求" name="skills">
                    <Select
                      mode="multiple"
                      placeholder="选择技能"
                      style={{ width: '100%' }}
                    >
                      {suggestions?.common_skills.map(skill => (
                        <Option key={skill} value={skill}>{skill}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="候选人状态" name="status">
                    <Select placeholder="选择状态" allowClear>
                      {suggestions?.status_options.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SearchOutlined />}
                  loading={loading}
                >
                  筛选
                </Button>
                <Button onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BulbOutlined />
              AI智能筛选
            </span>
          } 
          key="ai"
        >
          <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RobotOutlined style={{ color: 'var(--success-500)' }} />
                  <span className="gradient-text">智能候选人匹配</span>
                </div>
              }
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-200)'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="智能匹配说明"
                  description="输入具体的职位要求，AI将为您匹配最合适的候选人并给出评分"
                  type="info"
                  showIcon
                />
                
                <TextArea
                  placeholder="例如：我们需要一个资深前端开发工程师，负责React项目开发，要求有5年以上前端经验..."
                  value={jobRequirements}
                  onChange={(e) => setJobRequirements(e.target.value)}
                  rows={4}
                />
                
                <Button
                  type="primary"
                  icon={<RobotOutlined />}
                  onClick={handleSmartMatch}
                  loading={smartMatching}
                >
                  开始智能匹配
                </Button>
              </Space>
            </Card>
        </TabPane>
      </Tabs>

      {/* 筛选结果 */}
      {filteredCandidates.length > 0 && (
        <Card 
          title={`筛选结果 (${filteredCandidates.length})`} 
          style={{ marginTop: 24 }}
        >
          <Table
            columns={candidateColumns}
            dataSource={filteredCandidates}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
          />
        </Card>
      )}

      {/* 智能匹配结果显示 */}
      {smartMatchResults && (
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RobotOutlined style={{ color: 'var(--primary-600)' }} />
              智能匹配结果
            </div>
          }
          style={{ marginTop: 24 }}
        >
          <Alert
            message={`共分析了 ${smartMatchResults.total_candidates} 个候选人，找到 ${smartMatchResults.matches.length} 个匹配结果`}
            type="success"
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={smartMatchColumns}
            dataSource={smartMatchResults.matches}
            rowKey="candidate_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个匹配候选人`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      )}
    </div>
  );
};

export default FilterPanel;
