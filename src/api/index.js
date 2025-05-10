import Taro from '@tarojs/taro';

const BASE_URL = 'http://localhost:3001/api';

const request = (options) => {
  const { url, method = 'GET', data } = options;

  return Taro.request({
    url: `${BASE_URL}${url}`,
    method,
    data,
    header: {
      'content-type': 'application/json'
    }
  }).then(res => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return res.data;
    }
    throw new Error(res.data.message || '请求失败');
  });
};

export default {
  // 用户相关
  login: (data) => request({ url: '/user/login', method: 'POST', data }),
  register: (data) => request({ url: '/user/register', method: 'POST', data }),
  checkNickname: (nickname) => request({ url: `/user/check-nickname?nickname=${encodeURIComponent(nickname)}` }),
  uploadAvatar: (filePath) => Taro.uploadFile({
    url: `${BASE_URL}/user/upload-avatar`,
    filePath,
    name: 'file',
    header: {
      'content-type': 'multipart/form-data'
    }
  }).then(res => {
    const data = JSON.parse(res.data)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return data;
    }
    throw new Error(data.message || '上传失败');
  }),

  // 游记相关
  getNotes: () => request({ url: '/note' }),
}; 
