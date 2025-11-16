# Minecraft 论坛前端项目

基于 Vue3 + Vite + TypeScript 的前端项目

> **后端项目地址**：https://github.com/ANANAkiX/minecraft-forum.git
> **后端 API 服务**：http://localhost:8080  
> **后端 API 文档**：http://localhost:8080/doc.html

## 技术栈

- Vue 3（Composition API）
- Vite（构建工具）
- TypeScript（类型支持）
- Pinia（状态管理）
- Vue Router（路由管理）
- Element Plus（UI 组件库）
- Axios（HTTP 请求）
- @kangc/v-md-editor（Markdown 编辑器）

## 环境要求

- Node.js 18+
- npm 或 yarn 或 pnpm

## 安装依赖

```bash
npm install
```

或使用 yarn：
```bash
yarn install
```

或使用 pnpm：
```bash
pnpm install
```

## 开发

启动开发服务器（默认端口：5173）：
```bash
npm run dev
```

访问地址：http://localhost:5173

### 开发服务器配置

开发服务器已配置代理，所有 `/api` 请求会自动代理到后端服务：
- 前端开发服务器：http://localhost:5173
- 后端 API 服务：http://localhost:8080
- 代理配置：`/api` → `http://localhost:8080/api`

如需修改代理配置，请编辑 `vite.config.ts` 文件。

## 构建

构建生产版本：
```bash
npm run build
```

构建产物将输出到 `dist` 目录。

## 预览

预览生产构建：
```bash
npm run preview
```

## 代码检查

运行 ESLint 检查并自动修复：
```bash
npm run lint
```

## 功能模块

### 用户模块
- 用户注册/登录
- 用户信息展示
- 个人资料编辑
- 头像上传

### 资源模块
- 资源列表（分类、搜索、分页）
- 资源详情
- 资源上传（Markdown 编辑器）
- 资源点赞/收藏
- 资源下载

### 论坛模块
- 帖子列表（分类、搜索、分页）
- 帖子详情
- 发帖功能
- 评论/回复
- 点赞功能
- 热门帖子展示

### 后台管理
- 用户管理（列表、编辑、删除、角色分配）
- 资源管理（审核、编辑、删除）
- 帖子管理（编辑、删除）
- 角色管理（CRUD、权限分配）
- 权限管理（CRUD、API 选择器、路由配置）
- 分类管理（CRUD）

## 项目结构

```
src/
├── api/              # API 接口封装
│   ├── request.ts    # Axios 请求封装
│   ├── user.ts       # 用户相关 API
│   ├── forum.ts      # 论坛相关 API
│   ├── resource.ts   # 资源相关 API
│   └── admin.ts      # 后台管理 API
├── components/       # 组件
│   ├── admin/        # 后台管理组件
│   ├── HotPosts.vue  # 热门帖子组件
│   └── ReplyItem.vue # 回复项组件
├── layouts/          # 布局组件
│   └── MainLayout.vue # 主布局
├── router/           # 路由配置
│   └── index.ts      # 路由定义
├── stores/           # Pinia 状态管理
│   ├── user.ts       # 用户状态
│   └── hotPosts.ts   # 热门帖子缓存
├── views/            # 页面组件
│   ├── Home.vue      # 首页
│   ├── Forum.vue     # 论坛列表页
│   ├── ForumPost.vue # 帖子详情页
│   ├── Resource.vue  # 资源列表页
│   ├── ResourceDetail.vue # 资源详情页
│   ├── Profile.vue   # 个人资料页
│   └── Admin.vue     # 后台管理页
├── App.vue           # 根组件
└── main.ts           # 入口文件
```

## 核心功能说明

### 状态管理（Pinia）
- `userStore`：管理用户登录状态、权限信息
- `hotPostsStore`：缓存热门帖子数据，避免重复请求

### 权限控制
- 基于后端返回的权限列表进行前端路由和按钮显示控制
- 权限格式：`admin:模块:操作`（如：`admin:user:read`、`admin:post:create`）
- 支持页面访问权限和操作权限的细粒度控制

### 路由配置
- 使用 Vue Router 进行路由管理
- 支持路由守卫进行权限验证
- 支持动态路由和懒加载

### API 请求
- 统一使用 Axios 进行 HTTP 请求
- 请求拦截器自动添加 JWT Token
- 响应拦截器统一处理错误和登录过期

### 热门帖子组件
- `HotPosts` 组件可在多个页面复用（首页、论坛页、帖子详情页）
- 使用全局状态管理缓存数据，避免重复请求
- 支持发布帖子按钮（需权限）

## 开发规范

### 代码风格
- 使用 TypeScript 进行类型检查
- 使用 Composition API（`<script setup>`）
- 遵循 Vue 3 官方风格指南

### 组件规范
- 组件命名使用 PascalCase
- 组件文件使用 `.vue` 扩展名
- Props 和 Emits 需要定义类型

### API 调用
- 所有 API 调用统一封装在 `src/api/` 目录
- 使用 TypeScript 接口定义请求和响应类型
- 统一错误处理

### 状态管理
- 使用 Pinia 进行状态管理
- Store 文件统一放在 `src/stores/` 目录
- 避免在组件中直接操作全局状态

### 样式规范
- 使用 SCSS 预处理器
- 使用 Element Plus 的主题变量
- 组件样式使用 scoped

## 配置说明

### 环境变量
如需配置不同环境，可以创建 `.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:8080
```

### 代理配置
开发环境的代理配置在 `vite.config.ts` 中：
```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path
    }
  }
}
```

## 注意事项

1. **后端服务**：
   - 确保后端服务已启动（http://localhost:8080）
   - 确保后端 CORS 配置允许前端跨域访问

2. **API 请求**：
   - 所有 API 请求会自动添加 `/api` 前缀
   - 登录后会自动在请求头中添加 JWT Token

3. **权限验证**：
   - 前端权限控制仅用于 UI 显示，实际权限验证在后端
   - 不要依赖前端权限控制进行安全验证

4. **文件上传**：
   - 头像和资源文件上传需要登录
   - 文件大小限制由后端配置

5. **Markdown 编辑器**：
   - 使用 `@kangc/v-md-editor` 进行 Markdown 编辑
   - 支持代码高亮、数学公式等功能

## License

MIT
