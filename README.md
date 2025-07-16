# 🎬 Watch List - 剧海拾遗

一个基于 Next.js 14 开发的现代化影视管理平台，支持电影和电视剧的收藏、观看状态管理、评分展示等功能。

## ✨ 主要功能

- 🎥 **电影 & 电视剧管理**：支持添加、编辑和删除影视内容
- 📊 **观看状态追踪**：想看、正在看、已看完的状态管理
- ⭐ **多平台评分**：集成 TMDB 和豆瓣评分展示
- 🎨 **现代化 UI**：响应式设计，支持暗黑模式
- 🔍 **智能搜索**：按类型、状态、评分等多维度筛选
- 📱 **移动端优化**：完美适配移动设备
- 🎯 **个性化推荐**：基于类型的"猜你喜欢"功能
- 🔄 **无限滚动**：流畅的分页加载体验
- 📸 **图片管理**：集成阿里云 OSS 图片存储

## 🛠️ 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI 组件**: Radix UI + Tailwind CSS
- **数据库**: PostgreSQL + Prisma ORM
- **图片存储**: 阿里云 OSS
- **外部 API**: TMDB API, 豆瓣 API
- **身份验证**: JWT
- **状态管理**: React Hooks
- **图标**: Lucide React
- **主题**: next-themes

## 🚀 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 数据库
- 阿里云 OSS 账号

### 安装依赖

```bash
npm install
# 或者
yarn install
# 或者
pnpm install
```

### 环境配置

创建 `.env` 文件并配置以下环境变量：

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/watchlist"

# TMDB API 配置
TMDB_API_KEY="your_tmdb_api_key"

# 阿里云 OSS 配置
OSS_REGION="oss-cn-hongkong"
OSS_BUCKET_NAME="your-bucket-name"
OSS_ACCESS_KEY_ID="your_access_key_id"
OSS_ACCESS_KEY_SECRET="your_access_key_secret"

# JWT 配置
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="7d"
```

### 数据库设置

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📝 可用脚本

- `npm run dev` - 启动开发服务器 (使用 Turbopack)
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 代码检查

## 🎨 功能特性

### 主页功能
- 响应式网格布局（至少 2 列显示）
- 按观看状态、类型、评分筛选
- 多维度排序（默认、评分、年份、名称）
- 分页展示（每页 10 条）

### 详情页功能
- 高清背景图片（固定定位、透明度处理）
- 播放按钮（支持外部播放链接）
- 评分信息（TMDB + 豆瓣，保留一位小数）
- 演员阵容展示
- 基于类型的相似推荐

### 搜索与推荐
- 实时搜索 TMDB 数据库
- 智能去重处理
- 无限滚动加载
- "猜你喜欢"推荐系统

### 用户体验
- 暗黑模式支持
- 流畅的动画效果
- 移动端适配
- 加载状态指示

## 🗂️ 项目结构

```
src/
├── app/                    # App Router 页面
│   ├── api/               # API 路由
│   ├── movies/            # 电影相关页面
│   ├── tv/                # 电视剧相关页面
│   └── admin/             # 管理后台
├── components/            # React 组件
│   ├── ui/                # 基础 UI 组件
│   ├── MovieCard.tsx      # 电影卡片
│   ├── TvCard.tsx         # 电视剧卡片
│   └── ...
├── lib/                   # 工具函数
│   ├── prisma.ts          # Prisma 客户端
│   ├── tmdb.ts            # TMDB API
│   └── oss.ts             # OSS 配置
└── types/                 # TypeScript 类型定义
```

## 🔧 配置说明

### 数据库模型

主要数据模型包括：
- **Movie**: 电影信息
- **TvShow**: 电视剧信息
- **Person**: 演员/导演信息
- **Image**: 图片信息
- **WatchStatus**: 观看状态枚举

### 图片处理

支持多种图片类型：
- 海报图片 (posterUrl)
- 背景图片 (backdropUrl)
- 人物头像 (profileUrl)

### API 端点

- `/api/movies` - 电影 CRUD 操作
- `/api/tv` - 电视剧 CRUD 操作
- `/api/content/filtered` - 筛选内容
- `/api/search` - 搜索功能
- `/api/upload` - 图片上传

## 🎯 最佳实践

1. **性能优化**
   - 使用 Next.js 图片优化
   - 实现无限滚动
   - 客户端排序避免重复请求

2. **用户体验**
   - 响应式设计
   - 加载状态指示
   - 错误处理

3. **安全性**
   - 环境变量管理
   - JWT 身份验证
   - 输入验证

## 🚀 部署

### Vercel 部署

1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 自定义部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm run start
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交变更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Prisma](https://prisma.io/) - 数据库工具
- [TMDB](https://www.themoviedb.org/) - 电影数据库
- [Radix UI](https://radix-ui.com/) - 无障碍 UI 组件
- [Lucide](https://lucide.dev/) - 图标库

---

🎬 享受管理您的影视收藏吧！