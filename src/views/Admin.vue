<template>
  <div class="admin-page" v-if="userStore.hasPermission('page:admin')">
    <el-tabs v-model="activeTab">
      <!-- 用户管理：需要 admin:user:manage 权限（仅控制标签显示） -->
      <el-tab-pane label="用户管理" name="users" v-if="canAccessUserManagement">
        <UserManagement />
      </el-tab-pane>
      
      <!-- 资源管理：需要 admin:resource:manage 权限（仅控制标签显示） -->
      <el-tab-pane label="资源管理" name="resources" v-if="canAccessResourceManagement">
        <ResourceManagement />
      </el-tab-pane>
      
      <!-- 帖子管理：需要 admin:post:manage 权限（仅控制标签显示） -->
      <el-tab-pane label="帖子管理" name="posts" v-if="canAccessPostManagement">
        <PostManagement />
      </el-tab-pane>
      
      <!-- 角色管理：需要 admin:role:manage 权限（仅控制标签显示） -->
      <el-tab-pane label="角色管理" name="roles" v-if="canAccessRoleManagement">
        <RoleManagement />
      </el-tab-pane>
      
      <!-- 分类配置：需要 admin:category:manage 权限（仅控制标签显示） -->
      <el-tab-pane label="分类配置" name="categories" v-if="canAccessCategoryManagement">
        <CategoryManagement />
      </el-tab-pane>
      
      <!-- 文件管理：需要 admin:file:read 或 admin:file:manage 权限 -->
      <el-tab-pane label="文件管理" name="files" v-if="canAccessFileManagement">
        <FileManagement />
      </el-tab-pane>
      
      <!-- 权限管理：需要 admin:permission:manage 权限（仅控制标签显示） -->
      <el-tab-pane label="权限管理" name="permissions" v-if="canAccessPermissionManagement">
        <PermissionManagement />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import UserManagement from '@/components/admin/UserManagement.vue'
import FileManagement from '@/components/admin/FileManagement.vue'
import PermissionManagement from '@/components/admin/PermissionManagement.vue'
import CategoryManagement from '@/components/admin/CategoryManagement.vue'
import RoleManagement from '@/components/admin/RoleManagement.vue'
import ResourceManagement from '@/components/admin/ResourceManagement.vue'
import PostManagement from '@/components/admin/PostManagement.vue'

const router = useRouter()
const userStore = useUserStore()

// 页面级权限检查：如果没有page:admin权限，重定向到登录页
onMounted(() => {
  if (!userStore.hasPermission('page:admin')) {
    ElMessage.warning('您没有访问后台管理的权限')
    router.push({name: 'Login'})
  }
})

// 权限检查计算属性 - 统一管理所有权限检查逻辑
// 注意：这6个权限（admin:user:manage, admin:resource:manage, admin:post:manage, 
// admin:role:manage, admin:category:manage, admin:permission:manage）只控制导航标签的显示
// 页面内的CRUD操作由具体的操作权限控制（如admin:user:create, admin:user:update等）
const canAccessUserManagement = computed(() => {
  return userStore.hasPermission('admin:user:manage')
})

const canAccessResourceManagement = computed(() => {
  return userStore.hasPermission('admin:resource:manage')
})

const canAccessPostManagement = computed(() => {
  return userStore.hasPermission('admin:post:manage')
})

const canAccessRoleManagement = computed(() => {
  return userStore.hasPermission('admin:role:manage')
})

const canAccessCategoryManagement = computed(() => {
  return userStore.hasPermission('admin:category:manage')
})

const canAccessFileManagement = computed(() => {
  return userStore.hasPermission('admin:file:read') || userStore.hasPermission('admin:file:manage')
})

const canAccessPermissionManagement = computed(() => {
  return userStore.hasPermission('admin:permission:manage')
})

// 根据权限设置默认激活的标签页
const getDefaultTab = () => {
  if (canAccessUserManagement.value) {
    return 'users'
  }
  if (canAccessResourceManagement.value) {
    return 'resources'
  }
  if (canAccessPostManagement.value) {
    return 'posts'
  }
  if (canAccessRoleManagement.value) {
    return 'roles'
  }
  if (canAccessCategoryManagement.value) {
    return 'categories'
  }
  return 'users'
}

// 注意：权限变化监听已在 MainLayout.vue 中统一处理，这里不再重复监听
// 避免重复显示错误消息
const activeTab = ref(getDefaultTab())



onMounted(() => {
  // 所有管理组件会在自己的 onMounted 中加载数据
})
</script>

<style scoped>
.admin-page {
  padding: 20px 0;
}

/* Transfer 组件样式优化 - 确保左右布局对称 */
:deep(.el-transfer) {
  display: flex;
  align-items: stretch;
  width: 100%;
  gap: 0;
}

:deep(.el-transfer-panel) {
  flex: 1 1 0;
  min-width: 0;
  width: 0;
  height: 500px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

:deep(.el-transfer__buttons) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  flex-shrink: 0;
  gap: 10px;
  width: 120px;
  min-width: 120px;
}

:deep(.el-transfer__button) {
  margin: 0 !important;
}

:deep(.el-transfer-panel__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

:deep(.el-transfer-panel__list) {
  width: 100%;
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: visible;
}

/* 权限项样式优化 - 确保复选框和文字完美对齐 */
:deep(.el-transfer-panel__item) {
  padding: 8px 12px;
  white-space: nowrap;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  line-height: 15px;
  min-height: 36px;
  overflow: visible;
}

:deep(.el-transfer-panel__item .el-checkbox) {
  display: inline-flex;
  align-items: center;
  line-height: 15px;
  height: 20px;
  margin: 0;
  margin-right: 8px;
  vertical-align: middle;
}

:deep(.el-transfer-panel__item .el-checkbox__input) {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  line-height: 15px;
  height: 20px;
}

:deep(.el-transfer-panel__item .el-checkbox__inner) {
  vertical-align: middle;
  margin: 0;
}

:deep(.el-transfer-panel__item .el-checkbox__label) {
  width: 100%;
  padding-left: 0;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  overflow: visible !important;
  line-height: 15px;
  height: auto;
  vertical-align: middle;
  margin: 0;
  min-width: 0;
}

:deep(.el-transfer-panel__item .el-checkbox__label > div) {
  width: 100%;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  overflow: visible !important;
  min-width: auto;
  line-height: 15px;
  height: auto;
  vertical-align: middle;
}

/* 确保权限项内容不换行 */
:deep(.el-transfer-panel__item .el-checkbox__label span) {
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
  line-height: 15px;
  height: auto;
  overflow: visible !important;
}

/* 角色权限管理对话框样式优化 - 移除底部滚动条 */
:deep(.role-permission-dialog .el-dialog__body) {
  overflow: hidden !important;
  padding: 20px;
}

:deep(.role-permission-dialog .el-dialog) {
  overflow: hidden;
}

:deep(.role-permission-dialog) {
  overflow: hidden;
}

/* 对话框内容区域优化 */
:deep(.el-dialog__body) {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

/* 可点击表格行样式 */
.clickable-table :deep(.el-table__row) {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-table :deep(.el-table__row:hover) {
  background-color: var(--el-table-row-hover-bg-color);
}

/* 资源编辑对话框样式 */
.editor-wrapper {
  width: 100%;
}

.upload-demo {
  width: 100%;
}
</style>



