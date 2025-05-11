import { View, Text, Textarea, Input, Button, Image, Video } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import api from '../../api';
import backIcon from '../../assets/icons/back.png';
import './index.scss';

export default function Publish() {
  const router = useRouter();
  const { id } = router.params; // 获取路由参数，如果有id则为编辑模式
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const user = Taro.getStorageSync('user');

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack();
  };

  // 校验登录态
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // 检查登录状态
  const checkLoginStatus = () => {
    const user = Taro.getStorageSync('user');
    if (!user || !user.id) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 1500
      });
      // 延迟跳转，让用户看到提示
      setTimeout(() => {
        Taro.navigateTo({
          url: '/pages/login/index'
        });
      }, 1500);
    }
  };

  // 如果是编辑模式，获取游记详情
  useEffect(() => {
    if (id) {
      setIsEdit(true);
      fetchNoteDetail();
    }
  }, [id]);

  // 获取游记详情
  const fetchNoteDetail = async () => {
    setLoading(true);
    try {
      const note = await api.getNoteDetail(id);
      if (note) {
        setTitle(note.title || '');
        setContent(note.content || '');
        setImages(note.images || []);
        setVideo(note.video || null);
      }
    } catch (e) {
      Taro.showToast({ title: '获取游记详情失败', icon: 'none' });
    }
    setLoading(false);
  };

  //选择图片
  const chooseImage = () => {
    Taro.chooseImage({
      count: 9 - images.length,
      success: async (res) => {
        const filePath = res.tempFilePaths[0];
        try {
          const uploadRes = await api.uploadImage(filePath);
          setImages([...images, uploadRes.url]);
          Taro.showToast({ title: '图片上传成功', icon: 'success' });
        } catch (error) {
          console.error('图片上传失败:', error);
          Taro.showToast({ title: '图片上传失败', icon: 'none' });
        }
      }
    });
  };

  //选择视频
  const chooseVideo = () => {
    Taro.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: async (res) => {
        const filePath = res.tempFilePath;
        try {
          const uploadRes = await api.uploadVideo(filePath);
          setVideo(uploadRes.url);
          Taro.showToast({ title: '视频上传成功', icon: 'success' });
        } catch (error) {
          console.error('视频上传失败:', error);
          Taro.showToast({ title: '视频上传失败', icon: 'none' });
        }
      }
    });
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const removeVideo = () => {
    setVideo(null);
  };

  const handleSubmit = async () => {
    // 验证必填项
    if (!title.trim()) {
      return Taro.showToast({ title: '请填写标题', icon: 'none' });
    }
    
    if (!content.trim()) {
      return Taro.showToast({ title: '请填写内容', icon: 'none' });
    }
    
    if (images.length === 0) {
      return Taro.showToast({ title: '请上传至少一张图片', icon: 'none' });
    }

    setLoading(true);
    try {
      // 构建游记数据
      const noteData = {
        title,
        content,
        images,
        authorId: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        video: video
      };

      // 如果是编辑模式，添加ID
      if (isEdit && id) {
        noteData.id = id;
        await api.updateNote(noteData);
      } else {
        await api.createNote(noteData);
      }

      Taro.showToast({ 
        title: isEdit ? '更新成功' : '发布成功，等待审核', 
        icon: 'success' 
      });
      
      // 延迟1.5秒后跳转到"我的游记"页面
      setTimeout(() => {
        // 跳转到我的页面
        Taro.switchTab({
          url: '/pages/my/index',
          success: function() {
            // 通过事件通知"我的游记"页面刷新
            Taro.eventCenter.trigger('noteUpdated');
          }
        });
      }, 1500);
    } catch (e) {
      console.error('发布失败', e);
      Taro.showToast({ 
        title: isEdit ? '更新失败' : '发布失败', 
        icon: 'none' 
      });
    }
    setLoading(false);
  };

  return (
    <View className='publish'>
      <View className='back-btn' onClick={handleBack}>
        <Image className='back-icon' src={backIcon} />
      </View>
      
      <View className='form-item'>
        <Input
          className='title-input'
          placeholder='请输入标题 (必填)'
          value={title}
          onInput={e => setTitle(e.detail.value)}
        />
      </View>

      <View className='form-item'>
        <Textarea
          className='content-input'
          placeholder='请输入游记内容 (必填)'
          value={content}
          onInput={e => setContent(e.detail.value)}
        />
      </View>

      <View className='form-item'>
        <Text className='section-title'>图片 (必选，至少一张)</Text>
        <View className='image-list'>
          {images.map((img, index) => (
            <View key={index} className='image-item'>
              <Image src={img} mode='aspectFill' />
              <View className='delete-btn' onClick={() => removeImage(index)}>×</View>
            </View>
          ))}
          {images.length < 9 && (
            <View className='upload-btn' onClick={chooseImage}>
              <Text className='plus'>+</Text>
              <Text className='upload-text'>上传图片</Text>
            </View>
          )}
        </View>
      </View>

      <View className='form-item'>
        <Text className='section-title'>视频 (可选，仅限一个)</Text>
        <View className='video-container'>
          {video ? (
            <View className='video-item'>
              <Video src={video} className='video-preview' />
              <View 
                className='delete-btn' 
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡
                  removeVideo();
                }}
              >
                ×
              </View>
            </View>
          ) : (
            <View className='upload-btn' onClick={chooseVideo}>
              <Text className='plus'>+</Text>
              <Text className='upload-text'>上传视频</Text>
            </View>
          )}
        </View>
      </View>

      <Button
        className='submit-btn'
        // type='primary'
        loading={loading}
        onClick={handleSubmit}
      >
        {isEdit ? '更新' : '发布'}
      </Button>
    </View>
  );
} 
