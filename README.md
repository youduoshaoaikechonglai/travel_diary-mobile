# 旅游日记移动端

## 项目简介
本项目为旅游日记平台的移动端服务，基于 Taro + Rract + JavaScript 实现，提供用户登录注册、游记浏览、游记发布、个人中心等功能。

## 主要功能
### 用户登录/注册
- 用户名/密码登录注册
- 用户昵称重复校验
- 头像上传

### 游记列表
- 瀑布流游记卡片列表，支持分页加载游记
- 通过游记标题，作者昵称搜索游记
- 游记详情页跳转

### 游记详情
- 图片滑动，点击放大
- 视频点击全屏播放
- 点赞、评论、分享功能（待开发）
- 关注作者（待开发）

### 游记发布
- 支持图片、视频上传
- 编辑内容校验
- 发布返回我的游记页刷新

### 我的游记
- 个人游记列表管理
- 游记状态标识（待审核/已通过/未通过）
- 游记编辑/删除功能
- 游记发布页跳转

## 技术栈
- Taro 3.6.37
- React 18
- JavaScript
- Taro UI 组件库
- Redux（状态管理）
- Axios（网络请求）

## 项目结构
```
src/
├── api/         # API 接口
├── assets/      # 静态资源
├── components/  # 公共组件
├── pages/       # 页面组件
│   ├── login/   # 登录页
│   ├── index/   # 首页
│   ├── detail/  # 详情页
│   ├── publish/ # 发布页
│   └── my/      # 个人中心
├── store/       # Redux存储
├── utils/       # 工具函数
├── app.js       # 应用入口
├── app.config.js # 应用配置
└── index.html   # HTML 模板
```

## 开发指南
### 环境要求
- Node.js (>= 12.0.0)
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 运行项目
```bash
# 开发微信小程序
npm run dev:weapp
# 开发H5版本
npm run dev:h5
# 开发其他平台
npm run dev:[platform]
```

### 构建项目
```bash
# 构建微信小程序
npm run build:weapp
# 构建H5版本
npm run build:h5
# 构建其他平台
npm run build:[platform]
```

## API 说明
### 用户相关
- `POST /api/user/register` 用户注册
- `POST /api/user/login` 用户登录
- `GET /api/user/info` 获取用户信息
- `POST /api/user/upload-avatar` 上传用户头像

### 游记相关
- `GET /api/note/` 获取所有游记列表
- `GET /api/note/my` 获取我的游记列表
- `GET /api/note/:id` 获取游记详情
- `POST /api/note/` 发布新游记
- `PUT /api/note/:id` 编辑游记
- `DELETE /api/note/:id` 删除游记

### 文件上传
- `POST /api/upload/image` 上传图片

## 支持平台
- 微信小程序（weapp）
- H5（h5）
- 百度小程序（swan）
- 支付宝小程序（alipay）
- 字节跳动小程序（tt）
- QQ小程序（qq）
- 京东小程序（jd）
- 快应用（quickapp）
- 鸿蒙混合应用（harmony-hybrid）


