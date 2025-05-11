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
  uploadAvatar: (filePath) => {
    console.log('开始上传头像, 文件路径:', filePath);
    // Taro在小程序环境下不支持直接操作File对象，所以使用Taro专用方法
    return Taro.uploadFile({
      url: `${BASE_URL}/upload/avatar`,
      filePath: filePath,
      name: 'avatar',
      success: (res) => {
        console.log('上传成功响应:', res);
      },
      fail: (err) => {
        console.error('上传失败:', err);
      }
    }).then(res => {
      console.log('上传结果:', res);
      try {
        if (typeof res.data === 'string') {
          const data = JSON.parse(res.data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            return data;
          }
          throw new Error(data.message || '上传失败');
        } else {
          return res.data;
        }
      } catch (e) {
        console.error('解析上传响应失败:', e, res);
        throw new Error('上传失败，服务器响应格式错误');
      }
    });
  },

  // 游记相关
  getNotes: () => request({ url: '/note' }),
  getNoteDetail: (id) => request({ url: `/note/${id}` }),
  getMyNotes: (userId) => request({ url: `/note/my/${userId}` }),
  deleteNote: (id) => request({ url: `/note/${id}`, method: 'DELETE' }),
  createNote: (data) => request({ url: '/note', method: 'POST', data }),
  updateNote: (data) => request({ url: `/note/${data.id}`, method: 'PUT', data }),
}; 
