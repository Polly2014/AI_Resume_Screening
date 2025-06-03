import React, { useState, useCallback, useMemo } from 'react';
import { Input, Select, Space, Button, Tag, Tooltip, Dropdown, Grid } from 'antd';
import { SearchOutlined, FilterOutlined, ClearOutlined, SaveOutlined, HistoryOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Search } = Input;
const { useBreakpoint } = Grid;

interface AdvancedSearchProps {
  onSearch?: (filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  className?: string;
}

export interface SearchFilters {
  keyword: string;
  skills: string[];
  experience: string;
  location: string;
  status: string;
  education: string;
  salary: string;
}

const experienceOptions = [
  { label: '不限', value: '' },
  { label: '1年以下', value: '0-1' },
  { label: '1-3年', value: '1-3' },
  { label: '3-5年', value: '3-5' },
  { label: '5-10年', value: '5-10' },
  { label: '10年以上', value: '10+' },
];

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待筛选', value: 'pending' },
  { label: '已面试', value: 'interviewed' },
  { label: '已录用', value: 'hired' },
  { label: '已拒绝', value: 'rejected' },
];

const educationOptions = [
  { label: '不限', value: '' },
  { label: '大专', value: 'college' },
  { label: '本科', value: 'bachelor' },
  { label: '硕士', value: 'master' },
  { label: '博士', value: 'phd' },
];

const commonSkills = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
  'Python', 'Java', 'C++', 'Go', 'Rust', 'PHP',
  'HTML', 'CSS', 'SASS', 'Less', 'Webpack', 'Vite',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
  'AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Git'
];

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  placeholder = "搜索候选人姓名、技能、经验...",
  showFilters = true,
  className
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md; // 小于md断点视为移动端
  
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    skills: [],
    experience: '',
    location: '',
    status: '',
    education: '',
    salary: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // 保存搜索历史
  const saveToHistory = useCallback((keyword: string) => {
    if (keyword.trim() && !searchHistory.includes(keyword)) {
      const newHistory = [keyword, ...searchHistory.slice(0, 9)]; // 最多保存10条
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
  }, [searchHistory]);

  // 执行搜索
  const handleSearch = useCallback((searchFilters?: Partial<SearchFilters>) => {
    const finalFilters = { ...filters, ...searchFilters };
    if (finalFilters.keyword) {
      saveToHistory(finalFilters.keyword);
    }
    onSearch?.(finalFilters);
  }, [filters, onSearch, saveToHistory]);

  // 清除所有筛选
  const clearFilters = useCallback(() => {
    const emptyFilters: SearchFilters = {
      keyword: '',
      skills: [],
      experience: '',
      location: '',
      status: '',
      education: '',
      salary: ''
    };
    setFilters(emptyFilters);
    onSearch?.(emptyFilters);
  }, [onSearch]);

  // 更新筛选条件
  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // 快速筛选菜单
  const quickFilterMenu: MenuProps = {
    items: [
      {
        key: 'recent',
        label: '最近添加',
        onClick: () => handleSearch({ status: 'pending' })
      },
      {
        key: 'interviewed',
        label: '已面试',
        onClick: () => handleSearch({ status: 'interviewed' })
      },
      {
        key: 'hired',
        label: '已录用',
        onClick: () => handleSearch({ status: 'hired' })
      },
      {
        key: 'experienced',
        label: '3年以上经验',
        onClick: () => handleSearch({ experience: '3-5' })
      }
    ]
  };

  // 搜索历史菜单
  const historyMenu: MenuProps = {
    items: searchHistory.map((item, index) => ({
      key: index,
      label: item,
      onClick: () => {
        updateFilter('keyword', item);
        handleSearch({ keyword: item });
      }
    }))
  };

  // 活跃筛选器数量
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'skills') return Array.isArray(value) && value.length > 0;
      return value && value !== '';
    }).length;
  }, [filters]);

  return (
    <div className={`advanced-search ${className || ''}`}>
      {/* 移动端简化版搜索 */}
      {isMobile ? (
        <Space.Compact style={{ width: '100%' }}>
          <Search
            placeholder={placeholder}
            value={filters.keyword}
            onChange={(e) => updateFilter('keyword', e.target.value)}
            onSearch={(value) => handleSearch({ keyword: value })}
            style={{ flex: 1 }}
            size="large"
            allowClear
            enterButton
          />
        </Space.Compact>
      ) : (
        <>
          {/* 桌面端完整搜索栏 */}
          <Space.Compact style={{ width: '100%', marginBottom: showFilters ? '16px' : 0 }}>
            <Search
              placeholder={placeholder}
              value={filters.keyword}
              onChange={(e) => updateFilter('keyword', e.target.value)}
              onSearch={(value) => handleSearch({ keyword: value })}
              style={{ flex: 1 }}
              size="large"
              allowClear
            />
            
            {/* 搜索历史 */}
            {searchHistory.length > 0 && (
              <Dropdown menu={historyMenu} placement="bottomRight">
                <Button size="large" icon={<HistoryOutlined />} />
              </Dropdown>
            )}
            
            {/* 快速筛选 */}
            <Dropdown menu={quickFilterMenu} placement="bottomRight">
              <Button size="large" icon={<FilterOutlined />}>
                快速筛选
                {activeFiltersCount > 0 && (
                  <Tag 
                    color="primary" 
                    style={{ 
                      marginLeft: '4px', 
                      minWidth: '20px', 
                      textAlign: 'center' 
                    }}
                  >
                    {activeFiltersCount}
                  </Tag>
                )}
              </Button>
            </Dropdown>
            
            {/* 高级搜索切换 */}
            {showFilters && (
              <Button
                size="large"
                type={showAdvanced ? 'primary' : 'default'}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                高级
              </Button>
            )}
          </Space.Compact>

          {/* 高级筛选面板 */}
          {showFilters && showAdvanced && (
            <div className="advanced-filters animate-slideInRight">              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* 所有筛选条件放在同一行 */}
                <Space style={{ width: '100%' }} wrap>
                  <div style={{ minWidth: '180px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                      技能要求:
                    </label>
                    <Select
                      mode="multiple"
                      placeholder="选择技能"
                      value={filters.skills}
                      onChange={(value) => updateFilter('skills', value)}
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                      options={commonSkills.map(skill => ({ label: skill, value: skill }))}
                      allowClear
                    />
                  </div>

                  <div style={{ minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                      工作经验:
                    </label>
                    <Select
                      placeholder="选择经验"
                      value={filters.experience}
                      onChange={(value) => updateFilter('experience', value)}
                      style={{ width: '100%' }}
                      options={experienceOptions}
                      allowClear
                    />
                  </div>
                  
                  <div style={{ minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                      教育背景:
                    </label>
                    <Select
                      placeholder="选择学历"
                      value={filters.education}
                      onChange={(value) => updateFilter('education', value)}
                      style={{ width: '100%' }}
                      options={educationOptions}
                      allowClear
                    />
                  </div>

                  <div style={{ minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                      工作地点:
                    </label>
                    <Input
                      placeholder="输入城市"
                      value={filters.location}
                      onChange={(e) => updateFilter('location', e.target.value)}
                      allowClear
                    />
                  </div>

                  <div style={{ minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                      候选人状态:
                    </label>
                    <Select
                      placeholder="选择状态"
                      value={filters.status}
                      onChange={(value) => updateFilter('status', value)}
                      style={{ width: '100%' }}
                      options={statusOptions}
                      allowClear
                    />
                  </div>
                </Space>

                {/* 操作按钮 */}
                <Space>
                  <Button 
                    type="primary" 
                    icon={<SearchOutlined />}
                    onClick={() => handleSearch()}
                  >
                    搜索
                  </Button>
                  <Button 
                    icon={<ClearOutlined />}
                    onClick={clearFilters}
                  >
                    清除筛选
                  </Button>
                  <Tooltip title="保存当前筛选条件">
                    <Button 
                      icon={<SaveOutlined />}
                      onClick={() => {
                        // 保存筛选条件逻辑
                        localStorage.setItem('savedFilters', JSON.stringify(filters));
                      }}
                    >
                      保存
                    </Button>
                  </Tooltip>
                </Space>
              </Space>
            </div>
          )}

          {/* 活跃筛选器显示 */}
          {activeFiltersCount > 0 && (
            <div style={{ marginTop: '12px' }}>
              <Space wrap>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  当前筛选:
                </span>
                {filters.skills.map(skill => (
                  <Tag 
                    key={skill}
                    closable
                    onClose={() => updateFilter('skills', filters.skills.filter(s => s !== skill))}
                    color="blue"
                  >
                    {skill}
                  </Tag>
                ))}
                {filters.experience && (
                  <Tag 
                    closable
                    onClose={() => updateFilter('experience', '')}
                    color="green"
                  >
                    经验: {experienceOptions.find(opt => opt.value === filters.experience)?.label}
                  </Tag>
                )}
                {filters.location && (
                  <Tag 
                    closable
                    onClose={() => updateFilter('location', '')}
                    color="orange"
                  >
                    地点: {filters.location}
                  </Tag>
                )}
                {filters.status && (
                  <Tag 
                    closable
                    onClose={() => updateFilter('status', '')}
                    color="purple"
                  >
                    状态: {statusOptions.find(opt => opt.value === filters.status)?.label}
                  </Tag>
                )}
              </Space>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdvancedSearch;
