import { View, Text, Image, ScrollView } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import api from '../../api';
import './index.scss';

const statusMap = {
  pending: { text: '待审核', color: '#faad14' },
  approved: { text: '已通过', color: '#52c41a' },
  rejected: { text: '未通过', color: '#ff4d4f' }
};

export default function My() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = Taro.getStorageSync('user');

  const fetchMyNotes = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await api.getMyNotes(user.id);
      setNotes(res);
    } catch (e) {
      Taro.showToast({ title: '获取我的游记失败', icon: 'none' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMyNotes();
  }, []);

  const goToDetail = (id) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });
  };

  const goToPublish = () => {
    Taro.navigateTo({ url: '/pages/publish/index' });
  };

  return (
    <View className='my'>
      <View className='user-info'>
        <Image className='avatar' src={user?.avatarUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'} />
        <Text className='nickname'>{user?.nickname || user?.username || '未登录'}</Text>
      </View>
      <View className='header'>
        <Text className='title'>我的游记</Text>
        <View className='publish-btn' onClick={goToPublish}>发布游记</View>
      </View>

      <ScrollView scrollY className='note-list'>
        {notes.map(note => (
          <View key={note._id} className='note-item' onClick={() => goToDetail(note._id)}>
            {note.images?.[0] && (
              <Image className='note-image' src={note.images[0]} mode='aspectFill' />
            )}
            <View className='note-content'>
              <Text className='note-title'>{note.title}</Text>
              <Text className='note-desc' numberOfLines={2}>{note.content}</Text>
              <Text className='note-status' style={{ color: statusMap[note.status]?.color }}>
                {statusMap[note.status]?.text}
              </Text>
            </View>
          </View>
        ))}
        {loading && <Text className='loading'>加载中...</Text>}
      </ScrollView>
    </View>
  );
} 
