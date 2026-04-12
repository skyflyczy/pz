import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

interface AbortControllerItem {
  controller: AbortController;
  url: string | undefined;
}

// 存储所有正在进行的请求的控制器
const abortControllers: AbortControllerItem[] = [];



interface ApiResponse {
  code: number;
  message?: string;
  [key: string]: any;
}

const request = axios.create({
  baseURL: '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 创建 AbortController 并存储
    const controller = new AbortController();
    config.signal = controller.signal;
    abortControllers.push({ controller, url: config.url });
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    const config = response.config as InternalAxiosRequestConfig & { returnedDirectly?: boolean };
    
    // 从存储中移除已完成的请求
    const index = abortControllers.findIndex(item => item.url === config.url);
    if (index > -1) {
      abortControllers.splice(index, 1);
    }
    
    if (config.returnedDirectly) {
      return response;
    }
    if (res.code !== 200) {
      console.error('Response error:', res.message || 'Unknown error');
      return Promise.reject(new Error(res.message || 'Unknown error'));
    } else {
      return response;
    }
  },
  (error) => {
    // 从存储中移除已失败的请求
    if (error.config) {
      const index = abortControllers.findIndex(item => item.url === error.config.url);
      if (index > -1) {
        abortControllers.splice(index, 1);
      }
    }
    console.error('Response error:', error);
    return Promise.reject(error);
  }
);

// 中断所有请求
export const abortAllRequests = (): void => {
  abortControllers.forEach(({ controller }) => {
    controller.abort();
  });
  abortControllers.length = 0;
};

// 传 url 模糊匹配，中断匹配到的请求
export const abortRequestsByUrl = (urlPattern: string): void => {
  const toAbort = abortControllers.filter(item => item.url?.includes(urlPattern));
  toAbort.forEach(({ controller, url }) => {
    controller.abort();
    const index = abortControllers.findIndex(item => item.url === url);
    if (index > -1) {
      abortControllers.splice(index, 1);
    }
  });
};

export default request;