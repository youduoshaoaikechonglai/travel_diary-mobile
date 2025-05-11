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
    
    // 监听游记更新事件
    Taro.eventCenter.on('noteUpdated', fetchMyNotes);
    
    // 组件卸载时移除事件监听
    return () => {
      Taro.eventCenter.off('noteUpdated', fetchMyNotes);
    };
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    Taro.showModal({
      title: '提示',
      content: '确定要删除这篇游记吗？',
      success: async function (res) {
        if (res.confirm) {
          try {
            await api.deleteNote(id);
            Taro.showToast({ title: '删除成功', icon: 'success' });
            fetchMyNotes();
          } catch (e) {
            Taro.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  };

  const handleEdit = (e, id) => {
    e.stopPropagation();
    Taro.navigateTo({ url: `/pages/publish/index?id=${id}` });
  };

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
        <View className='publish-btn' onClick={goToPublish}>+ 新增</View>
      </View>

      <ScrollView scrollY className='note-list'>
        {notes.map(note => (
          <View key={note._id} className='note-item' onClick={() => goToDetail(note._id)}>
            <View className='note-left'>
              {note.images?.[0] && (
                <Image className='note-image' src={note.images[0]} mode='aspectFill' />
              )}
            </View>
            <View className='note-right'>
              <View className='note-content'>
                <Text className='note-title'>{note.title}</Text>
                <Text className='note-desc' numberOfLines={2}>{note.content}</Text>
              </View>
              <View className='note-footer'>
                <Text className='note-status' style={{ backgroundColor: statusMap[note.status]?.color }}>
                  {statusMap[note.status]?.text}
                </Text>
                <View className='note-actions'>
                  <Text className='action-btn delete' onClick={(e) => handleDelete(e, note._id)}>删除</Text>
                  <Text className='action-btn edit' onClick={(e) => handleEdit(e, note._id)}>编辑</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
        {loading && <Text className='loading'>加载中...</Text>}
      </ScrollView>
    </View>
  );
}
