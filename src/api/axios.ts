import axios from 'axios';

const service = axios.create({
  baseURL: '', // 请求本地json文件，那么baseURL取空字符串，域名就会是项目域名
  timeout: 30000,
});



// 请求拦截
service.interceptors.request.use(
  (config) => {
    return config;
  },
  (error: any) => {
    Promise.reject(error);
  },
);

// 响应拦截
service.interceptors.response.use(
  (response: any) => {
    const res = response.data;
    return Promise.resolve(res);
  },
  (error: any) => {
    return Promise.reject(error);
  },
);

export default service;
