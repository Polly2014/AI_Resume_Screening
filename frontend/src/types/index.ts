// 数据类型定义
export interface Candidate {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  education?: string;
  experience_years?: number;
  current_position?: string;
  current_company?: string;
  skills?: string[];
  status: 'pending' | 'interviewed' | 'rejected' | 'hired';
  notes?: string;
  created_at: string;
  updated_at: string;
  resumes?: Resume[];
}

export interface Resume {
  id: number;
  filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  raw_text?: string;
  extracted_data?: any;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  processed_at?: string;
  candidate_id: number;
}

export interface FilterCriteria {
  keywords?: string[];
  education?: string;
  min_experience?: number;
  max_experience?: number;
  skills?: string[];
  status?: string;
}

export interface FilterResponse {
  candidates: Candidate[];
  total_count: number;
  filter_criteria: FilterCriteria;
}

export interface UploadResponse {
  message: string;
  uploaded_files: string[];
  failed_files: Array<{
    filename: string;
    error: string;
  }>;
  total_processed: number;
}

export interface SmartMatch {
  candidate_id: number;
  name: string;
  email?: string;
  phone?: string;
  education?: string;
  experience_years?: number;
  current_position?: string;
  current_company?: string;
  skills?: string[];
  status: 'pending' | 'interviewed' | 'rejected' | 'hired';
  score: number;
  reasons: string[];
  concerns: string[];
}

export interface SmartMatchResponse {
  job_requirements: string;
  matches: SmartMatch[];
  total_candidates: number;
}

export interface FilterSuggestions {
  common_skills: string[];
  education_levels: string[];
  experience_ranges: Array<{
    label: string;
    min: number;
    max?: number;
  }>;
  status_options: Array<{
    value: string;
    label: string;
  }>;
}

export interface AIOptimizationResponse {
  suggestions: string[];
  optimized_criteria: FilterCriteria;
}

// 上传项目类型
export interface UploadItem {
  uid: string;
  name: string;
  status: 'uploading' | 'done' | 'error';
  response?: UploadResponse;
  error?: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status?: string;
}

// 扩展File类型以支持uid
export interface UploadFile extends File {
  uid?: string;
}

// 候选人状态映射
export const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  interviewed: '已面试',
  rejected: '已拒绝',
  hired: '已录用',
};

// 候选人状态颜色
export const STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  interviewed: 'blue',
  rejected: 'red',
  hired: 'green',
};
