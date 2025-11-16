# Minecraft 论坛前端项目

基于 Vue3 + Vite + TypeScript 的前端项目

> **后端项目地址**：https://github.com/ANANAkiX/minecraft-forum.git
> 
> **后端 API 服务**：http://localhost:8080  
> 
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
- Element Plus Icons（图标库）

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
### 登录账号 admin
### 登录密码 123456
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
- 用户注册/登录（UUID Token 认证）
- 用户信息展示
- 个人资料编辑
- 头像上传
- 个人中心（查看上传的资源、发布的帖子、点赞、收藏、评论）
- 夜间模式切换

### 资源模块
- 资源列表（分类、搜索、分页）
- 资源详情
- 资源上传（Markdown 编辑器、多文件上传）
- 资源点赞/收藏
- 资源下载

### 论坛模块
- 帖子列表（分类、搜索、分页）
- 帖子详情
- 发帖功能（Markdown 编辑器）
- 评论/回复（支持无限层级嵌套）
- 点赞功能
- 热门帖子展示（全局缓存，避免重复请求）

### 搜索模块
- 全局搜索（导航栏搜索框）
- Elasticsearch 全文搜索
- 搜索帖子和资源（包括资源文件名）
- 搜索结果高亮显示（支持夜间模式）
- 实时搜索建议（防抖处理）
- 键盘导航支持
- 搜索服务不可用时的友好提示

### 后台管理
- **用户管理**：用户列表、创建、编辑、删除、角色分配（通过"角色管理"按钮）
- **资源管理**：资源列表、审核、编辑、删除
- **帖子管理**：帖子列表、编辑、删除
- **角色管理**：角色列表、创建、编辑、删除、权限分配
- **权限管理**：权限列表、创建、编辑、删除、API 选择器、路由配置
- **分类管理**：分类列表、创建、编辑、删除
- **文件管理**：文件列表、删除
- **懒加载**：管理页面和子组件支持懒加载，提高性能

## 项目结构

```
src/
├── api/              # API 接口封装
│   ├── request.ts    # Axios 请求封装
│   ├── user.ts       # 用户相关 API
│   ├── forum.ts      # 论坛相关 API
│   ├── resource.ts   # 资源相关 API
│   ├── admin.ts      # 后台管理 API
│   ├── search.ts     # 搜索相关 API
│   └── config.ts     # 系统配置 API
├── components/       # 组件
│   ├── admin/        # 后台管理组件
│   │   ├── UserManagement.vue
│   │   ├── ResourceManagement.vue
│   │   ├── PostManagement.vue
│   │   ├── RoleManagement.vue
│   │   ├── PermissionManagement.vue
│   │   ├── CategoryManagement.vue
│   │   └── FileManagement.vue
│   ├── HotPosts.vue  # 热门帖子组件（可复用）
│   └── ReplyItem.vue # 回复项组件
├── composables/      # 组合式函数
│   └── usePageTitle.ts  # 动态标题管理
├── layouts/          # 布局组件
│   └── MainLayout.vue # 主布局（包含搜索、导航等）
├── router/           # 路由配置
│   └── index.ts      # 路由定义（包含权限守卫）
├── stores/           # Pinia 状态管理
│   ├── user.ts       # 用户状态（登录、权限、Token）
│   └── hotPosts.ts   # 热门帖子缓存
├── utils/            # 工具函数
│   └── auth.ts       # 认证相关工具（已废弃 JWT 解析）
├── views/            # 页面组件
│   ├── Home.vue      # 首页
│   ├── Forum.vue     # 论坛列表页
│   ├── ForumPost.vue # 帖子详情页
│   ├── ResourceDetail.vue # 资源详情页
│   ├── Upload.vue    # 资源上传页
│   ├── UserProfile.vue # 个人中心页
│   ├── Admin.vue     # 后台管理页（懒加载）
│   ├── Login.vue     # 登录页
│   ├── Register.vue  # 注册页
│   └── NotFound.vue  # 404 页面
├── App.vue           # 根组件
├── main.ts           # 入口文件
└── style.css         # 全局样式（主题变量、夜间模式）
```

## 核心功能说明

### 状态管理（Pinia）
- **`userStore`**：管理用户登录状态、权限信息、Token 管理
  - 自动加载用户信息（刷新页面时）
  - 权限检查和更新
  - Token 刷新和权限同步
- **`hotPostsStore`**：缓存热门帖子数据，避免重复请求
  - 全局缓存，页面切换时不重新请求
  - 支持手动清除缓存

### 权限控制
- 基于后端返回的权限列表进行前端路由和按钮显示控制
- 权限格式：`模块:操作`（如：`admin:user:read`、`admin:post:create`、`elasticsearch:search`）
- 支持页面访问权限和操作权限的细粒度控制
- 路由守卫自动检查权限，无权限时跳转登录页
- 按钮和操作根据权限动态显示/隐藏

### 路由配置
- 使用 Vue Router 进行路由管理
- 支持路由守卫进行权限验证
- 支持动态路由和懒加载
- 支持动态标题（帖子详情、资源详情）
- 自动加载用户信息（刷新页面时）

### API 请求
- 统一使用 Axios 进行 HTTP 请求
- 请求拦截器自动添加 UUID Token（`Authorization: Bearer <UUID>`）
- 响应拦截器统一处理错误和登录过期（401 错误）
- 自动处理 503 错误（搜索服务不可用）

### 搜索功能
- 全局搜索框（导航栏）
- 实时搜索建议（防抖 300ms）
- 搜索结果高亮显示（关键词绿色高亮，支持夜间模式）
- 键盘导航支持（上下箭头选择，回车确认）
- 搜索服务不可用时的友好提示
- 搜索结果分三行显示：标题、高亮内容、作者

### 热门帖子组件
- `HotPosts` 组件可在多个页面复用（首页、论坛页、帖子详情页）
- 使用全局状态管理缓存数据，避免重复请求
- 支持发布帖子按钮（需 `admin:post:create` 权限）
- 样式与首页保持一致

### 夜间模式
- 支持全局夜间模式切换
- 所有组件自动适配夜间模式
- 搜索高亮关键词支持夜间模式颜色
- 使用 Element Plus 主题变量，自动适配

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
   - 确保 Redis 服务正常运行（Token 存储）

2. **API 请求**：
   - 所有 API 请求会自动添加 `/api` 前缀
   - 登录后会自动在请求头中添加 UUID Token（`Authorization: Bearer <UUID>`）
   - 401 错误会自动跳转到登录页
   - 503 错误会显示搜索服务不可用的提示

3. **权限验证**：
   - 前端权限控制仅用于 UI 显示，实际权限验证在后端
   - 不要依赖前端权限控制进行安全验证
   - 刷新页面时会自动加载用户信息和权限

4. **搜索功能**：
   - 需要 Elasticsearch 服务支持
   - 如果 Elasticsearch 不可用，会显示友好提示
   - 搜索关键词长度至少 2 个字符
   - 搜索结果支持高亮显示（夜间模式自动适配）

5. **文件上传**：
   - 头像和资源文件上传需要登录
   - 文件大小限制由后端配置

6. **Markdown 编辑器**：
   - 使用 `@kangc/v-md-editor` 进行 Markdown 编辑
   - 支持代码高亮、数学公式等功能

7. **性能优化**：
   - 热门帖子使用全局缓存，避免重复请求
   - 后台管理页面支持懒加载
   - 搜索输入使用防抖处理，避免频繁请求

8. **夜间模式**：
   - 使用 Element Plus 主题变量，自动适配
   - 搜索高亮关键词支持夜间模式颜色
   - 所有组件样式自动适配夜间模式

## License

MIT
