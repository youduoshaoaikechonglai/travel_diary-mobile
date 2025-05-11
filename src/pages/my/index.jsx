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

  // 判断是否可以编辑游记
  const canEdit = (status) => {
    return status === 'pending' || status === 'rejected';
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
          <View key={note._id} className='note-card' onClick={() => goToDetail(note._id)}>
            {/* 上区域：图片、标题和内容 */}
            <View className='note-card-top'>
              <View className='note-card-image'>
                {note.images?.[0] && (
                  <Image className='image' src={note.images[0]} mode='aspectFill' />
                )}
              </View>
              <View className='note-card-content'>
                <Text className='title'>{note.title}</Text>
                <Text className='desc'>{note.content}</Text>

                {/* 显示拒绝原因 */}
                {note.status === 'rejected' && note.rejectReason && (
                  <View className='reject-reason'>
                    <Text className='reject-label'>拒绝原因：</Text>
                    <Text className='reject-text'>{note.rejectReason}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 下区域：状态和操作按钮 */}
            <View className='note-card-bottom'>
              <View className='note-status' style={{ backgroundColor: statusMap[note.status]?.color }}>
                {statusMap[note.status]?.text}
              </View>
              <View className='note-actions'>
                <View className='action-btn delete' onClick={(e) => handleDelete(e, note._id)}>删除</View>
                {canEdit(note.status) && (
                  <View className='action-btn edit' onClick={(e) => handleEdit(e, note._id)}>编辑</View>
                )}
              </View>
            </View>
          </View>
        ))}
        {loading && <Text className='loading'>加载中...</Text>}
        {!loading && notes.length === 0 && (
          <View className='empty-notes'>
            <Text>暂无游记</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
