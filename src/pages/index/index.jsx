import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Input, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import api from '../../api';
import './index.scss';

export default function Index() {
  const [diaries, setDiaries] = useState([]);
  const [filteredDiaries, setFilteredDiaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [leftColumn, setLeftColumn] = useState([]);
  const [rightColumn, setRightColumn] = useState([]);

  // 获取游记列表
  const fetchDiaries = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!isRefresh && pageNum > 1 && (!hasMore || loading)) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // 调用 getNotes 接口，但不传递关键字参数
      const result = await api.getNotes({
        page: pageNum,
        limit: 10
      });
      
      // 确保接口返回的是数组
      const newDiaries = Array.isArray(result) ? result : (result?.data || []);
      
      let allDiaries;
      if (pageNum === 1) {
        allDiaries = newDiaries;
        setDiaries(newDiaries);
      } else {
        allDiaries = [...diaries, ...newDiaries];
        setDiaries(allDiaries);
      }
      
      // 根据关键字过滤数据
      filterDiariesByKeyword(allDiaries, keyword);
      
      // 判断是否还有更多数据
      setHasMore(newDiaries.length >= 10);
      setPage(pageNum);
    } catch (error) {
      console.error('获取游记列表失败', error);
      Taro.showToast({
        title: '获取游记列表失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
        Taro.stopPullDownRefresh();
      }
    }
  }, [hasMore, loading, diaries, keyword]);

  // 前端过滤数据的函数
  const filterDiariesByKeyword = (allDiaries, searchKeyword) => {
    if (!searchKeyword.trim()) {
      // 如果没有关键字，显示所有数据
      setFilteredDiaries(allDiaries);
    } else {
      // 前端搜索逻辑：标题或作者名称中包含关键字的游记
      const filtered = allDiaries.filter(diary => 
        (diary.title && diary.title.toLowerCase().includes(searchKeyword.toLowerCase())) || 
        (diary.nickname && diary.nickname.toLowerCase().includes(searchKeyword.toLowerCase()))
      );
      setFilteredDiaries(filtered);
    }
    
    // 更新瀑布流布局
    updateColumns(searchKeyword ? filteredDiaries : allDiaries);
  };
  
  // 更新瀑布流列的数据
  const updateColumns = (diariesToShow) => {
    const left = [];
    const right = [];
    
    diariesToShow.forEach((diary, index) => {
      if (index % 2 === 0) {
        left.push(diary);
      } else {
        right.push(diary);
      }
    });
    
    setLeftColumn(left);
    setRightColumn(right);
  };

  const handleSearchInput = (e) => {
    setKeyword(e.detail.value);
  };

  const handleSearch = () => {
    // 使用现有的日记数据进行前端过滤
    filterDiariesByKeyword(diaries, keyword);
  };

  const onPullDownRefresh = useCallback(() => {
    setPage(1);
    fetchDiaries(1, true);
  }, [fetchDiaries]);

  const onLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchDiaries(page + 1);
    }
  }, [fetchDiaries, page, hasMore, loading]);

  const navigateToDetail = (id) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${id}`
    });
  };

  const navigateToPublish = () => {
    Taro.navigateTo({
      url: '/pages/publish/index'
    });
  };

  useEffect(() => {
    fetchDiaries();
  }, []);

  // 当关键字变化时，重新过滤数据
  useEffect(() => {
    filterDiariesByKeyword(diaries, keyword);
  }, [keyword]);

  const renderDiaryCard = (diary) => {
    // 创建适配于视图需要的数据结构
    const diaryData = {
      _id: diary._id,
      title: diary.title,
      images: diary.images || [],
      authorInfo: {
        nickname: diary.nickname || '未知用户',
        avatar: diary.avatarUrl || 'https://via.placeholder.com/40'
      }
    };

    return (
      <View 
        className='index__card' 
        key={diaryData._id}
        onClick={() => navigateToDetail(diaryData._id)}
      >
        {diaryData.images?.[0] && (
          <View className='index__card-image-container'>
            <Image 
              className='index__card-image' 
              src={diaryData.images[0]} 
              mode='aspectFill'
              lazyLoad
            />
          </View>
        )}
        <View className='index__card-title'>{diaryData.title}</View>
        <View className='index__card-author'>
          <Image 
            className='index__card-avatar' 
            src={diaryData.authorInfo.avatar} 
            mode='aspectFill'
          />
          <View className='index__card-name'>{diaryData.authorInfo.nickname}</View>
        </View>
      </View>
    );
  };

  return (
    <View className='index'>
      <View className='index__search-container'>
        <View className='index__search-bar'>
          <Input
            className='index__search-input'
            value={keyword}
            placeholder='搜索游记'
            onInput={handleSearchInput}
            confirmType='search'
            onConfirm={handleSearch}
          />
          <View className='index__search-btn' onClick={handleSearch}>搜索</View>
        </View>
      </View>

      <ScrollView
        className='index__scroll'
        scrollY
        enableBackToTop
        onScrollToLower={onLoadMore}
        lowerThreshold={300}
        refresherEnabled={true}
        refresherTriggered={refreshing}
        onRefresherRefresh={onPullDownRefresh}
      >
        <View className='index__waterfall'>
          <View className='index__column'>
            {leftColumn.map(diary => renderDiaryCard(diary))}
          </View>

          <View className='index__column'>
            {rightColumn.map(diary => renderDiaryCard(diary))}
          </View>
        </View>
        
        {loading && !refreshing && (
          <View className='index__loading'>加载中...</View>
        )}
        
        {!hasMore && diaries.length > 0 && keyword === '' && (
          <View className='index__no-more'>没有更多了</View>
        )}
        
        {!loading && filteredDiaries.length === 0 && (
          <View className='index__empty'>
            {keyword ? `没有找到"${keyword}"相关的游记` : '暂无游记'}
          </View>
        )}
      </ScrollView>

      <View className='index__publish-btn' onClick={navigateToPublish}>
        <Text className='index__publish-icon'>+</Text>
        <Text className='index__publish-text'>发布</Text>
      </View>
    </View>
  );
}
