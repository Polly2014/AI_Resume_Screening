// API基础配置和候选人相关接口
import axios from 'axios';
import { 
  Candidate, 
  Resume, 
  FilterCriteria, 
  FilterResponse, 
  FilterSuggestions, 
  SmartMatchResponse, 
  UploadResponse
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 增加超时时间至60秒
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false // 确保不发送凭证
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log(`发送请求: ${config.method?.toUpperCase()} ${config.url}`, config);
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`响应成功: ${response.config.method?.toUpperCase()} ${response.config.url}`, response);
    return response;
  },
  (error) => {
    console.error('API响应错误:', error);
    if (error.response) {
      console.error('错误状态码:', error.response.status);
      console.error('错误数据:', error.response.data);
    } else if (error.request) {
      console.error('没有收到响应:', error.request);
    } else {
      console.error('请求设置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

// 候选人相关接口
export const candidateAPI = {
  // 获取候选人列表
  getCandidates: (params?: { skip?: number; limit?: number }) =>
    api.get<Candidate[]>('/candidates/', { params }),

  // 获取候选人详情
  getCandidate: (id: number) =>
    api.get<Candidate>(`/candidates/${id}`),

  // 创建候选人
  createCandidate: (data: Partial<Candidate>) =>
    api.post<Candidate>('/candidates/', data),

  // 更新候选人
  updateCandidate: (id: number, data: Partial<Candidate>) =>
    api.patch<Candidate>(`/candidates/${id}`, data),

  // 更新候选人状态
  updateCandidateStatus: (id: number, status: string, notes?: string) =>
    api.patch<Candidate>(`/candidates/${id}/status`, { status, notes }),

  // 删除候选人
  deleteCandidate: (id: number) =>
    api.delete<void>(`/candidates/${id}`),

  // 筛选候选人
  filterCandidates: (filterData: FilterCriteria, params?: { skip?: number; limit?: number }) =>
    api.post<FilterResponse>('/candidates/filter', filterData, { params }),
};

// 简历相关接口
export const resumeAPI = {
  // 批量上传简历
  uploadResumes: (files: File[]) => {
    console.log("创建FormData对象");
    const formData = new FormData();
    files.forEach(file => {
      console.log(`添加文件到FormData: ${file.name}, 大小: ${file.size} bytes, 类型: ${file.type}`);
      formData.append('files', file);
    });
    
    console.log("发送上传请求到后端");
    return api.post<UploadResponse>('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 获取简历内容
  getResumeContent: (id: number) =>
    api.get<any>(`/resumes/${id}/content`),

  // 获取候选人的简历
  getCandidateResumes: (candidateId: number) =>
    api.get<Resume[]>(`/resumes/candidate/${candidateId}`),
};

// 筛选相关接口
export const filterAPI = {
  // 优化筛选条件
  optimizeFilter: (naturalQuery: string) =>
    api.post<any>('/filters/optimize', { natural_language_query: naturalQuery }),

  // 智能匹配
  smartMatch: (jobRequirements: string, candidateIds?: number[]) =>
    api.post<SmartMatchResponse>('/filters/smart-match', { 
      job_requirements: jobRequirements, 
      candidate_ids: candidateIds || [] 
    }),

  // 获取筛选建议
  getFilterSuggestions: () =>
    api.get<FilterSuggestions>('/filters/suggestions'),
};

export default api;
