import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Swiper, SwiperItem, Video, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import heartIcon from '../../assets/icons/heart.png';
import heartActiveIcon from '../../assets/icons/heart-active.png';
import messageIcon from '../../assets/icons/message.png';
import shareIcon from '../../assets/icons/share.png';
import backIcon from '../../assets/icons/back.png';
import api from '../../api';
import './index.scss';

const Detail = () => {
  const router = Taro.useRouter();
  const { id } = router.params;
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isFullscreenVideo, setIsFullscreenVideo] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const videoRef = useRef(null);

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack();
  };

  // 获取游记详情
  useEffect(() => {
    const fetchDiaryDetail = async () => {
      if (!id) {
        console.error('没有提供游记ID');
        Taro.showToast({
          title: '缺少游记ID参数',
          icon: 'none'
        });
        return;
      }
      
      try {
        setLoading(true);
        console.log('正在获取游记详情，ID:', id);
        
        const result = await api.getNoteDetail(id);
        console.log('API返回结果:', result);
        
        if (!result) {
          console.error('返回结果为空');
          setLoading(false);
          return;
        }
        
        // 根据后端TravelNote模型调整数据映射
        const diaryData = {
          ...result,
          id: result._id || id,
          title: result.title || '无标题',
          content: result.content || '',
          images: result.images || [],
          video: result.video ? { url: result.video } : null,
          status: result.status || 'approved',
          rejectReason: result.rejectReason,
          createdAt: new Date(result.createdAt).toLocaleDateString(),
          author: {
            id: result.authorId,
            nickname: result.nickname || '未知用户',
            avatar: result.avatarUrl || 'https://via.placeholder.com/50',
            username: result.nickname
          }
        };
        
        console.log('获取到游记详情:', diaryData);
        setDiary(diaryData);
        
        // 检查是否是当前登录用户
        const currentUser = Taro.getStorageSync('user');
        const isOwner = currentUser && currentUser.id === diaryData.author.id;
        setIsCurrentUser(isOwner);
        
      } catch (error) {
        console.error('获取游记详情失败', error);
        Taro.showToast({
          title: '获取游记详情失败',
          icon: 'none'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDiaryDetail();
  }, [id]);

  // 单独使用一个useEffect来处理点赞和关注状态
  // 这样在用户登录状态变化时，可以正确更新这些状态
  useEffect(() => {
    if (diary) {
      // 检查是否已关注作者
      if (diary.author && diary.author.id && !isCurrentUser) {
        checkFollowStatus(diary.author.id);
      }
      
      // 检查是否已点赞
      if (diary.id) {
        checkLikeStatus(diary.id);
      }
    }
  }, [diary, isCurrentUser]);

  // 检查关注状态
  const checkFollowStatus = async (authorId) => {
    if (!authorId) return;
    
    try {
      // 获取当前登录用户
      const currentUser = Taro.getStorageSync('user');
      if (!currentUser || !currentUser.id) {
        // 未登录用户不显示关注状态
        setIsFollowed(false);
        return;
      }
      
      // 临时模拟，实际项目中应该调用API
      // 添加当前用户ID到关注存储中，确保每个用户的关注状态独立
      const isFollowedFromStorage = Taro.getStorageSync(`followed_${currentUser.id}_${authorId}`);
      setIsFollowed(!!isFollowedFromStorage);
    } catch (error) {
      console.error('获取关注状态失败', error);
    }
  };

  // 检查点赞状态
  const checkLikeStatus = async (diaryId) => {
    if (!diaryId) return;
    
    try {
      // 获取当前登录用户
      const currentUser = Taro.getStorageSync('user');
      if (!currentUser || !currentUser.id) {
        // 未登录用户不能点赞
        setIsLiked(false);
        return;
      }
      
      // 从本地存储读取点赞状态，加入用户ID确保每个用户状态独立
      const isLikedFromStorage = Taro.getStorageSync(`liked_diary_${currentUser.id}_${diaryId}`);
      setIsLiked(!!isLikedFromStorage);
    } catch (error) {
      console.error('获取点赞状态失败', error);
    }
  };

  // 分享功能
  const handleShare = () => {
    if (!diary) return;
    
    // 检查是否已登录
    const user = Taro.getStorageSync('user');
    
    // 打印调试信息
    console.log('分享功能 - 用户信息:', user);
    
    // 检查用户是否登录
    if (!user) {
      // 未登录，提示用户登录
      Taro.showModal({
        title: '提示',
        content: '需要登录后才能分享内容',
        confirmText: '去登录',
        cancelText: '取消',
        success: function(res) {
          if (res.confirm) {
            // 跳转到登录页面
            Taro.navigateTo({
              url: '/pages/login/index'
            });
          }
        }
      });
      return;
    }
    
    // 已登录，显示分享菜单
    Taro.showActionSheet({
      itemList: ['分享给微信好友', '分享到朋友圈'],
      success: function (res) {
        switch (res.tapIndex) {
          case 0: // 分享给微信好友
            shareToWechatFriend();
            break;
          case 1: // 分享到朋友圈
            shareToWechatTimeline();
            break;
          default:
            break;
        }
      },
      fail: function (res) {
        console.log('分享菜单关闭', res.errMsg);
      }
    });
  };
  
  // 分享给微信好友
  const shareToWechatFriend = () => {
    if (!diary) return;
    
    // 使用Taro原生API触发分享
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    });
    
    // 手动触发分享给朋友
    Taro.shareAppMessage({
      title: diary.title,
      path: `/pages/detail/index?id=${id}`,
      imageUrl: diary.coverImage || (diary.images && diary.images.length > 0 ? diary.images[0] : ''),
      success: function() {
        Taro.showToast({
          title: '分享成功',
          icon: 'success',
          duration: 1500
        });
      },
      fail: function() {
        Taro.showToast({
          title: '分享失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  };
  
  // 分享到朋友圈
  const shareToWechatTimeline = () => {
    if (!diary) return;
    
    // 使用Taro原生API触发分享到朋友圈
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareTimeline']
    });
    
    // 手动触发分享到朋友圈
    Taro.shareTimeline({
      title: diary.title,
      query: `id=${id}`,
      imageUrl: diary.coverImage || (diary.images && diary.images.length > 0 ? diary.images[0] : ''),
      success: function() {
        Taro.showToast({
          title: '分享成功',
          icon: 'success',
          duration: 1500
        });
      },
      fail: function() {
        Taro.showToast({
          title: '分享失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  };

  // 自定义分享给朋友
  Taro.useShareAppMessage(() => {
    if (!diary) return {};
    
    return {
      title: diary.title,
      path: `/pages/detail/index?id=${id}`,
      imageUrl: diary.coverImage
    };
  });

  // 自定义分享到朋友圈
  Taro.useShareTimeline(() => {
    if (!diary) return {};
    
    return {
      title: diary.title,
      query: `id=${id}`,
      imageUrl: diary.coverImage
    };
  });

  // 图片预览
  const handleImageClick = (index) => {
    if (!diary || !diary.images || diary.images.length === 0) return;
    
    setCurrentImageIndex(index);
    setShowImagePreview(true);
    
    // 使用Taro的预览图片API
    Taro.previewImage({
      current: diary.images[index],
      urls: diary.images,
      success: () => {
        console.log('预览图片成功');
      },
      fail: (err) => {
        console.error('预览图片失败', err);
      }
    });
  };

  // 视频全屏播放
  const handleVideoFullscreen = () => {
    // 微信小程序中不能直接通过ref控制视频全屏
    // 而是应该通过Video组件的属性或原生API
    setIsFullscreenVideo(true);
    
    // 在Taro/小程序中，通常视频点击后会自动处理播放行为
    // 或通过组件上的controls=true让用户自己控制
    // 下面的代码在小程序中可能不生效，我们使用其他方式
    // if (videoRef.current) {
    //   videoRef.current.requestFullScreen();
    // }
    
    // 使用Taro API
    try {
      const videoContext = Taro.createVideoContext('diaryVideo');
      videoContext.requestFullScreen({
        direction: 0, // 0: 正常竖屏, 90: 横屏
      });
      // 进入全屏后自动播放视频
      videoContext.play();
    } catch (e) {
      console.error('全屏请求失败:', e);
    }
  };

  // 处理视频点击事件
  const handleVideoClick = (e) => {
    
      handleVideoFullscreen();
    
  };

  // 视频退出全屏
  const handleVideoExitFullscreen = () => {
    // 如果当前不是全屏状态，则不执行退出操作
    if (!isFullscreenVideo) return;
    
    setIsFullscreenVideo(false);
    
    try {
      Taro.createVideoContext('diaryVideo').exitFullScreen();
    } catch (e) {
      console.error('退出全屏失败:', e);
    }
  };

  // 处理点赞
  const handleLike = async () => {
    if (!diary) return;
    
    // 检查用户是否已登录
    const currentUser = Taro.getStorageSync('user');
    if (!currentUser || !currentUser.id) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后再点赞',
        confirmText: '去登录',
        cancelText: '取消',
        success: function(res) {
          if (res.confirm) {
            Taro.navigateTo({
              url: '/pages/login/index'
            });
          }
        }
      });
      return;
    }
    
    try {
      const newLikeStatus = !isLiked;
      setIsLiked(newLikeStatus);
      
      // 保存点赞状态到本地存储，加入用户ID确保每个用户状态独立
      if (newLikeStatus) {
        Taro.setStorageSync(`liked_diary_${currentUser.id}_${diary.id}`, true);
      } else {
        Taro.removeStorageSync(`liked_diary_${currentUser.id}_${diary.id}`);
      }
      
      // 显示提示
      Taro.showToast({
        title: newLikeStatus ? '点赞成功' : '取消点赞',
        icon: 'success',
        duration: 1500
      });
      
      // 实际项目中应该调用API
      // const result = await diaryAPI.likeDiary(diary.id, newLikeStatus);
    } catch (error) {
      console.error('点赞操作失败', error);
      setIsLiked(!isLiked); // 恢复原状态
      Taro.showToast({
        title: '操作失败，请稍后再试',
        icon: 'none'
      });
    }
  };

  // 处理评论
  const handleComment = () => {
    if (!diary) return;
    
    // 这里可以添加跳转到评论页面或打开评论输入框
    Taro.showToast({
      title: '评论功能开发中',
      icon: 'none',
      duration: 1500
    });
  };

  // 处理关注
  const handleFollow = async () => {
    if (!diary || !diary.author?.id) return;
    
    // 检查用户是否已登录
    const currentUser = Taro.getStorageSync('user');
    if (!currentUser || !currentUser.id) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后再关注',
        confirmText: '去登录',
        cancelText: '取消',
        success: function(res) {
          if (res.confirm) {
            Taro.navigateTo({
              url: '/pages/login/index'
            });
          }
        }
      });
      return;
    }
    
    try {
      const newFollowStatus = !isFollowed;
      setIsFollowed(newFollowStatus);
      
      // 显示提示
      Taro.showToast({
        title: newFollowStatus ? '关注成功' : '已取消关注',
        icon: 'success',
        duration: 1500
      });
      
      // 临时存储关注状态，实际项目中应该调用API
      if (newFollowStatus) {
        Taro.setStorageSync(`followed_${currentUser.id}_${diary.author.id}`, true);
      } else {
        Taro.removeStorageSync(`followed_${currentUser.id}_${diary.author.id}`);
      }
      
      // 实际API调用示例
      // await userAPI.followAuthor(diary.author.id, newFollowStatus);
    } catch (error) {
      console.error('关注操作失败', error);
      setIsFollowed(!isFollowed); // 恢复原状态
      Taro.showToast({
        title: '操作失败，请稍后再试',
        icon: 'none'
      });
    }
  };

  if (loading) {
    return (
      <View className='detail detail--loading'>
        <Text className='detail__loading-text'>加载中...</Text>
      </View>
    );
  }

  if (!diary) {
    return (
      <View className='detail detail--error'>
        <Text className='detail__error-text'>未找到游记信息</Text>
      </View>
    );
  }

  // 判断是否有视频
  const hasVideo = diary.video && diary.video.url;
  // 判断是否有图片
  const hasImages = diary.images && diary.images.length > 0;
  
  return (
    <View className='detail'>
      {/* 顶部作者信息 - 在视频全屏时隐藏 */}
      {!isFullscreenVideo && (
        <View className='detail__header'>
          <View className='detail__back-btn' onClick={handleBack}>
            <Image className='detail__back-icon' src={backIcon} />
          </View>
          <View className='detail__author'>
            <Image 
              className='detail__author-avatar' 
              src={diary.author?.avatar || 'https://via.placeholder.com/50'} 
              mode='aspectFill'
            />
            <Text className='detail__author-name'>{diary.author?.nickname || diary.author?.username || '未知用户'}</Text>
          </View>
          {!isCurrentUser && (
            <Button 
              className={`detail__share-btn ${isFollowed ? 'detail__share-btn--followed' : ''}`} 
              onClick={handleFollow}
            >
              <Text className='detail__btn-text'>{isFollowed ? '已关注' : '关注'}</Text>
            </Button>
          )}
        </View>
      )}

      
      {/* 媒体轮播 - 仅当有图片或视频时显示 */}
      {(hasImages || hasVideo) && (
        <View className='detail__media'>
          <Swiper
            className='detail__swiper'
            indicatorDots
            indicatorColor='rgba(255, 255, 255, 0.6)'
            indicatorActiveColor='#ffffff'
            circular
            autoplay={false}
            onChange={(e) => {
              setCurrentImageIndex(e.detail.current);
              // 如果从视频滑动到其他项目，暂停视频播放
              if (hasVideo && e.detail.current !== 0) {
                try {
                  const videoContext = Taro.createVideoContext('diaryVideo');
                  videoContext.pause();
                } catch (error) {
                  console.error('暂停视频失败:', error);
                }
              }
            }}
            disableTouch={isFullscreenVideo}
          >
            {/* 如果有视频，将视频作为第一项 */}
            {hasVideo && (
              <SwiperItem className='detail__swiper-item'>
                <View 
                  className='detail__video-container'
                  onClick={(e) => {
                    // 阻止点击事件冒泡到SwiperItem
                    e.stopPropagation();
                  }}
                >
                  <Video
                    id="diaryVideo"
                    ref={videoRef}
                    className='detail__video'
                    src={diary.video.url}
                    poster={diary.video.poster || diary.coverImage}
                    initialTime={0}
                    controls
                    showCenterPlayBtn
                    onFullscreenChange={(e) => {
                      // 添加null检查，防止访问undefined的属性
                      const isFullScreen = e && e.detail && e.detail.fullScreen;
                      setIsFullscreenVideo(!!isFullScreen);
                    }}
                    onClick={handleVideoClick}
                    enableProgressGesture={false} // 启用水平滑动调整进度功能
                    showPlayBtn={true} // 显示播放按钮
                    showMuteBtn={true} // 显示静音按钮
                    objectFit="contain" // 确保视频比例正确
                    playBtnPosition="center" // 播放按钮居中
                  />
                </View>
              </SwiperItem>
            )}

            {/* 图片轮播 */}
            {hasImages && diary.images.map((image, index) => (
              <SwiperItem key={index} className='detail__swiper-item'>
                <Image
                  className='detail__image'
                  src={image}
                  mode='aspectFill'
                  onClick={() => handleImageClick(index)}
                />
              </SwiperItem>
            ))}
          </Swiper>
          
          {/* 图片索引 - 仅当有多个媒体项时显示 */}
          {(hasImages || hasVideo) && (
            <View className='detail__image-index'>
              {currentImageIndex + 1}/{hasVideo ? (diary.images ? diary.images.length + 1 : 1) : diary.images.length}
            </View>
          )}
        </View>
      )}

      {/* 游记标题 - 在视频全屏时隐藏 */}
      {!isFullscreenVideo && (
        <View className='detail__title-container'>
          <Text className='detail__title'>{diary.title}</Text>
        </View>
      )}

      {/* 游记地点和时间 - 在视频全屏时隐藏 */}
      {!isFullscreenVideo && (
        <View className='detail__meta-container'>
          {diary.location && (
            <View className='detail__location'>
              <Text className='detail__location-text'>{diary.location}</Text>
            </View>
          )}
          {diary.createdAt && (
            <Text className='detail__date'>{diary.createdAt}</Text>
          )}
        </View>
      )}

      {/* 游记内容 - 在视频全屏时隐藏 */}
      {!isFullscreenVideo && (
        <View className='detail__content'>
          <Text className='detail__content-text'>{diary.content}</Text>
        </View>
      )}

      {/* 底部信息 - 在视频全屏时隐藏 */}
      {!isFullscreenVideo && (
        <View className='detail__footer'>
          <View className='detail__stats'>
            <View className='detail__stats-item' onClick={handleLike}>
              <View className={`detail__icon detail__icon--like ${isLiked ? 'detail__icon--active' : ''}`}>
                <Image 
                  src={isLiked ? heartActiveIcon : heartIcon}
                  className='detail__icon-image'
                />
              </View>
              <Text className={`detail__stats-label ${isLiked ? 'detail__stats-label--active' : ''}`}>
                {isLiked ? '已点赞' : '点赞'}
              </Text>
            </View>
            <View className='detail__stats-item' onClick={handleComment}>
              <View className='detail__icon detail__icon--comment'>
                <Image 
                  src={messageIcon}
                  className='detail__icon-image'
                />
              </View>
              <Text className='detail__stats-label'>评论</Text>
            </View>
            <View className='detail__stats-item' onClick={handleShare}>
              <View className='detail__icon detail__icon--share'>
                <Image 
                  src={shareIcon}
                  className='detail__icon-image'
                />
              </View>
              <Text className='detail__stats-label'>分享</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default Detail; 
