import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// 定义状态类型
export interface AppState {
  loading: boolean;
  candidates: any[];
  filters: {
    skills: string[];
    experience: string;
    location: string;
    status: string;
  };
  uploadProgress: number;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

// 定义动作类型
export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CANDIDATES'; payload: any[] }
  | { type: 'UPDATE_FILTERS'; payload: Partial<AppState['filters']> }
  | { type: 'SET_UPLOAD_PROGRESS'; payload: number }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<AppState['notifications'][0], 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' };

// 初始状态
const initialState: AppState = {
  loading: false,
  candidates: [],
  filters: {
    skills: [],
    experience: '',
    location: '',
    status: ''
  },
  uploadProgress: 0,
  notifications: []
};

// Reducer函数
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_CANDIDATES':
      return { ...state, candidates: action.payload };
    
    case 'UPDATE_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case 'SET_UPLOAD_PROGRESS':
      return { ...state, uploadProgress: action.payload };
    
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [...state.notifications, action.payload as any] 
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    
    default:
      return state;
  }
};

// Context创建
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// Provider组件
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook for using context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// 便捷的hooks
export const useNotifications = () => {
  const { state, dispatch } = useAppContext();
  
  const addNotification = useCallback((notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => {
    const notificationId = Date.now().toString();
    dispatch({ 
      type: 'ADD_NOTIFICATION', 
      payload: {
        ...notification,
        id: notificationId,
        timestamp: new Date()
      } as any
    });
    
    // 自动移除通知 - 使用 notificationId 而不是 DOM 查询
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
    }, 5000);
  }, [dispatch]);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, [dispatch]);

  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, [dispatch]);

  return {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearNotifications
  };
};

export const useLoading = () => {
  const { state, dispatch } = useAppContext();
  
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, [dispatch]);

  return { loading: state.loading, setLoading };
};
