# Admin 组件解耦说明

## 已提取的组件

1. **UserManagement.vue** - 用户管理组件
   - 包含用户列表、搜索、分页、编辑、删除等功能
   - 使用 UserRoleDialog 组件处理角色管理

2. **UserRoleDialog.vue** - 用户角色管理对话框
   - 处理用户角色的分配和移除

## 待提取的组件

按照相同的模式，可以继续提取以下组件：

1. **ResourceManagement.vue** - 资源管理
2. **PostManagement.vue** - 帖子管理
3. **RoleManagement.vue** - 角色管理
4. **CategoryManagement.vue** - 分类配置
5. **FileManagement.vue** - 文件管理
6. **PermissionManagement.vue** - 权限管理
7. **RolePermissionDialog.vue** - 角色权限管理对话框

## 提取步骤

1. 从 Admin.vue 中复制对应 tab-pane 的内容
2. 提取相关的数据和方法
3. 创建独立的组件文件
4. 在 Admin.vue 中使用新组件替换原内容

## 共享工具函数

工具函数已提取到 `@/utils/admin.ts`：
- `formatDateTime` - 格式化日期时间
- `formatFileSize` - 格式化文件大小
- `getStatusType` - 获取状态类型
- `getStatusText` - 获取状态文本

