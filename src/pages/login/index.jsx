import { View, Text, Input, Button, Image } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import api from '../../api';
import './index.scss';

const DEFAULT_AVATAR = 'https://img.yzcdn.cn/vant/cat.jpeg';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // 昵称唯一性校验
  const checkNickname = async (val) => {
    setNickname(val);
    if (!val) {
      setNicknameStatus('');
      return;
    }
    try {
      const res = await api.checkNickname(val);
      if (res.exists) {
        setNicknameStatus('昵称已被占用');
      } else {
        setNicknameStatus('昵称可用');
      }
    } catch {
      setNicknameStatus('校验失败');
    }
  };

  // 选择头像
  const chooseAvatar = () => {
    Taro.chooseImage({
      count: 1,
      success: async (res) => {
        const filePath = res.tempFilePaths[0];
        try {
          const uploadRes = await api.uploadAvatar(filePath);
          setAvatar(uploadRes.url);
          Taro.showToast({ title: '头像上传成功', icon: 'success' });
        } catch (error) {
          console.error('头像上传失败:', error);
          Taro.showToast({ title: '头像上传失败', icon: 'none' });
        }
      }
    });
  };

  // 注册
  const handleRegister = async () => {
    if (!username || !password || !nickname) {
      return Taro.showToast({ title: '请填写完整信息', icon: 'none' });
    }
    if (nicknameStatus === '昵称已被占用') {
      return Taro.showToast({ title: '昵称已被占用', icon: 'none' });
    }
    setLoading(true);
    try {
      await api.register({
        username,
        password,
        nickname,
        avatarUrl: avatar || DEFAULT_AVATAR
      });
      const user = await api.login({ username, password });
      Taro.setStorageSync('user', user);
      Taro.showToast({ title: '注册成功', icon: 'success' });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 1000);
    } catch (e) {
      console.error('注册失败:', e);
      Taro.showToast({ title: e.message || '注册失败', icon: 'none' });
    }
    setLoading(false);
  };

  // 登录
  const handleLogin = async () => {
    if (!username || !password) {
      return Taro.showToast({ title: '请填写账号和密码', icon: 'none' });
    }
    setLoading(true);
    try {
      const user = await api.login({ username, password });
      Taro.setStorageSync('user', user);
      Taro.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 1000);
    } catch (e) {
      Taro.showToast({ title: e.message || '登录失败', icon: 'none' });
    }
    setLoading(false);
  };

  return (
    <View className='login-page'>
      <View className='switch-tab'>
        <Text className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>登录</Text>
        <Text className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>注册</Text>
      </View>
      <View className='form-item'>
        <Input placeholder='请输入账号' value={username} onInput={e => setUsername(e.detail.value)} />
      </View>
      <View className='form-item'>
        <Input placeholder='请输入密码' password value={password} onInput={e => setPassword(e.detail.value)} />
      </View>
      {!isLogin && (
        <>
          <View className='form-item'>
            <Input placeholder='请输入昵称' value={nickname} onInput={e => checkNickname(e.detail.value)} />
            {nicknameStatus && <Text className={nicknameStatus === '昵称可用' ? 'ok' : 'err'}>{nicknameStatus}</Text>}
          </View>
          <View className='form-item avatar-upload'>
            <Image src={avatar || DEFAULT_AVATAR} className='avatar' />
            <Button size='mini' onClick={chooseAvatar}>上传头像</Button>
          </View>
        </>
      )}
      <Button className='submit-btn' type='primary' loading={loading} onClick={isLogin ? handleLogin : handleRegister}>
        {isLogin ? '登录' : '注册'}
      </Button>
    </View>
  );
} 
