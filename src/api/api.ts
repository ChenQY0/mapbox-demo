import $axiosJson from './axios'; // 引入封装的axios实例
// 获取本地json数据
export const getJsonDataApi = () => {
  return $axiosJson({
    url: `/city.json`, // json文件地址
    method: 'GET',
  });
};
