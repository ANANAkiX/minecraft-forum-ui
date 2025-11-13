<template>
  <div class="admin-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="用户管理" name="users" v-if="userStore.hasPermission('admin:user:read') || userStore.hasPermission('admin:user:manage')">
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <el-input
            v-model="userKeyword"
            placeholder="搜索用户名、昵称或邮箱"
            style="width: 300px"
            clearable
            @clear="loadUsers"
            @keyup.enter="loadUsers"
          >
            <template #append>
              <el-button @click="loadUsers">搜索</el-button>
            </template>
          </el-input>
        </div>
        <el-table :data="userList" v-loading="userLoading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="nickname" label="昵称" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="role" label="角色" width="120">
            <template #default="scope">
              <el-select 
                v-model="scope.row.role" 
                size="small" 
                @change="handleRoleChange(scope.row)"
                style="width: 100px"
              >
                <el-option label="用户" value="USER" />
                <el-option label="管理员" value="ADMIN" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-switch
                v-model="scope.row.status"
                :active-value="0"
                :inactive-value="1"
                active-text="正常"
                inactive-text="禁用"
                @change="handleStatusChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="注册时间" />
          <el-table-column label="操作" width="250">
            <template #default="scope">
              <el-button size="small" @click="handleManageRoles(scope.row)">权限管理</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-if="userTotal > 0"
          v-model:current-page="userPage"
          v-model:page-size="userPageSize"
          :total="userTotal"
          layout="total, prev, pager, next, sizes"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="loadUsers"
          @size-change="handleUserPageSizeChange"
          style="margin-top: 20px; justify-content: flex-end"
        />
        
        <!-- 权限管理对话框 -->
        <el-dialog v-model="roleDialogVisible" title="用户权限管理" width="800px">
          <div v-if="currentUserForRole">
            <p><strong>用户：</strong>{{ currentUserForRole.username }} ({{ currentUserForRole.nickname }})</p>
            <el-tabs v-model="permissionTab">
              <el-tab-pane label="角色管理" name="roles">
                <el-divider />
                <h4>已分配角色</h4>
                <div style="margin-bottom: 20px;">
                  <el-tag
                    v-for="role in userRoles"
                    :key="role.id"
                    style="margin-right: 10px; margin-bottom: 10px"
                    closable
                    @close="handleRemoveRole(role.id)"
                  >
                    {{ role.name }}
                  </el-tag>
                  <el-tag v-if="userRoles.length === 0" type="info">暂无角色</el-tag>
                </div>
                <el-divider />
                <h4>分配新角色</h4>
                <el-select
                  v-model="selectedRoleId"
                  placeholder="选择角色"
                  style="width: 200px; margin-right: 10px"
                >
                  <el-option
                    v-for="role in allRoles"
                    :key="role.id"
                    :label="role.name"
                    :value="role.id"
                    :disabled="userRoles.some(ur => ur.id === role.id)"
                  />
                </el-select>
                <el-button type="primary" @click="handleAssignRole">分配</el-button>
              </el-tab-pane>
              
              <el-tab-pane label="权限管理" name="permissions">
                <el-divider />
                <h4>用户所有权限（包括通过角色获得的）</h4>
                <div style="max-height: 200px; overflow-y: auto; margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                  <el-tag
                    v-for="permission in userPermissions"
                    :key="permission.id"
                    style="margin-right: 10px; margin-bottom: 10px"
                    type="success"
                    :closable="isDirectPermission(permission.id)"
                    @close="handleRemovePermission(permission.id)"
                  >
                    {{ permission.name }} ({{ permission.code }})
                    <span v-if="permissionSources[permission.code]" style="font-size: 10px; margin-left: 4px; color: #999;">
                      [{{ permissionSources[permission.code].join(', ') }}]
                    </span>
                  </el-tag>
                  <el-tag v-if="userPermissions.length === 0" type="info">暂无权限</el-tag>
                </div>
                <el-divider />
                <h4>直接分配权限</h4>
                <el-radio-group v-model="permissionTypeFilter" style="margin-bottom: 20px;">
                  <el-radio-button label="">全部</el-radio-button>
                  <el-radio-button label="PAGE">页面权限</el-radio-button>
                  <el-radio-button label="ACTION">操作权限</el-radio-button>
                </el-radio-group>
                <div style="max-height: 300px; overflow-y: auto;">
                  <el-checkbox-group v-model="selectedPermissionIds" style="display: flex; flex-direction: column; gap: 10px;">
                    <el-checkbox
                      v-for="permission in filteredPermissions"
                      :key="permission.id"
                      :label="permission.id"
                      :disabled="userPermissions.some(up => up.id === permission.id)"
                    >
                      <div>
                        <strong>{{ permission.name }}</strong>
                        <div style="font-size: 12px; color: #999; margin-top: 4px;">
                          {{ permission.code }} - {{ permission.description || '无描述' }}
                        </div>
                      </div>
                    </el-checkbox>
                  </el-checkbox-group>
                  <el-empty v-if="filteredPermissions.length === 0" description="暂无可用权限" />
                </div>
                <div style="margin-top: 20px;">
                  <el-button type="primary" @click="handleAssignPermissions">分配选中权限</el-button>
                  <el-button @click="selectedPermissionIds = []">清空选择</el-button>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-dialog>
      </el-tab-pane>
      
      <el-tab-pane label="资源管理" name="resources" v-if="userStore.hasPermission('admin:resource:manage')">
        <el-table :data="resourceList" v-loading="resourceLoading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="authorName" label="作者" />
          <el-table-column prop="category" label="分类" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="发布时间" />
          <el-table-column label="操作" width="250">
            <template #default="scope">
              <el-button size="small" @click="handleViewResource(scope.row.id)">查看</el-button>
              <el-button
                size="small"
                type="success"
                v-if="scope.row.status === 'PENDING'"
                @click="handleApproveResource(scope.row.id)"
              >
                审核通过
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDeleteResource(scope.row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="帖子管理" name="posts" v-if="userStore.hasPermission('admin:post:manage')">
        <el-table :data="postList" v-loading="postLoading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="authorName" label="作者" />
          <el-table-column prop="category" label="分类" />
          <el-table-column prop="viewCount" label="浏览" width="80" />
          <el-table-column prop="likeCount" label="点赞" width="80" />
          <el-table-column prop="createTime" label="发布时间" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="handleViewPost(scope.row.id)">查看</el-button>
              <el-button size="small" type="danger" @click="handleDeletePost(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="角色管理" name="roles" v-if="userStore.hasPermission('admin:role:read') || userStore.hasPermission('admin:role:manage')">
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div></div>
          <el-button type="primary" @click="handleAddRole" v-if="userStore.hasPermission('admin:role:create') || userStore.hasPermission('admin:role:manage')">添加角色</el-button>
        </div>
        <el-table :data="roleList" v-loading="roleLoading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="角色名称" />
          <el-table-column prop="code" label="角色代码" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                {{ scope.row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" />
          <el-table-column label="操作" width="300">
            <template #default="scope">
              <el-button size="small" @click="handleEditRole(scope.row)" v-if="userStore.hasPermission('admin:role:update') || userStore.hasPermission('admin:role:manage')">编辑</el-button>
              <el-button size="small" @click="handleManageRolePermissions(scope.row)" v-if="userStore.hasPermission('admin:role:manage') || userStore.hasPermission('admin:permission:manage')">权限管理</el-button>
              <el-button size="small" type="danger" @click="handleDeleteRole(scope.row.id)" v-if="userStore.hasPermission('admin:role:delete') || userStore.hasPermission('admin:role:manage')">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 角色编辑对话框 -->
        <el-dialog v-model="roleEditDialogVisible" :title="roleDialogTitle" width="500px">
          <el-form :model="roleForm" label-width="100px">
            <el-form-item label="角色名称" required>
              <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
            </el-form-item>
            <el-form-item label="角色代码" required>
              <el-input v-model="roleForm.code" placeholder="请输入角色代码（如：MODERATOR）" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="roleForm.description" type="textarea" placeholder="请输入角色描述" />
            </el-form-item>
            <el-form-item label="状态">
              <el-switch v-model="roleForm.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="roleDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSaveRole">保存</el-button>
          </template>
        </el-dialog>
        
        <!-- 角色权限管理对话框 -->
        <el-dialog v-model="rolePermissionDialogVisible" title="角色权限管理" width="800px">
          <div v-if="currentRoleForPermission">
            <p><strong>角色：</strong>{{ currentRoleForPermission.name }} ({{ currentRoleForPermission.code }})</p>
            <el-divider />
            <h4>已分配权限</h4>
            <div style="max-height: 200px; overflow-y: auto; margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
              <el-tag
                v-for="permission in rolePermissions"
                :key="permission.id"
                style="margin-right: 10px; margin-bottom: 10px"
                type="success"
                closable
                @close="handleRemoveRolePermission(permission.id)"
              >
                {{ permission.name }} ({{ permission.code }})
              </el-tag>
              <el-tag v-if="rolePermissions.length === 0" type="info">暂无权限</el-tag>
            </div>
            <el-divider />
            <h4>分配新权限</h4>
            <el-radio-group v-model="rolePermissionTypeFilter" style="margin-bottom: 20px;">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="PAGE">页面权限</el-radio-button>
              <el-radio-button label="ACTION">操作权限</el-radio-button>
            </el-radio-group>
            <div style="max-height: 300px; overflow-y: auto;">
              <el-checkbox-group v-model="selectedRolePermissionIds" style="display: flex; flex-direction: column; gap: 10px;">
                <el-checkbox
                  v-for="permission in filteredRolePermissions"
                  :key="permission.id"
                  :label="permission.id"
                  :disabled="rolePermissions.some(rp => rp.id === permission.id)"
                >
                  <div>
                    <strong>{{ permission.name }}</strong>
                    <div style="font-size: 12px; color: #999; margin-top: 4px;">
                      {{ permission.code }} - {{ permission.description || '无描述' }}
                    </div>
                  </div>
                </el-checkbox>
              </el-checkbox-group>
              <el-empty v-if="filteredRolePermissions.length === 0" description="暂无可用权限" />
            </div>
            <div style="margin-top: 20px;">
              <el-button type="primary" @click="handleAssignRolePermissions">分配选中权限</el-button>
              <el-button @click="selectedRolePermissionIds = []">清空选择</el-button>
            </div>
          </div>
        </el-dialog>
      </el-tab-pane>
      
      <el-tab-pane label="分类配置" name="categories" v-if="userStore.hasPermission('admin:category:manage')">
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <el-radio-group v-model="categoryType" @change="handleCategoryTypeChange">
              <el-radio-button label="RESOURCE">资源分类</el-radio-button>
              <el-radio-button label="FORUM">论坛分类</el-radio-button>
            </el-radio-group>
          </div>
          <el-button type="primary" @click="handleAddCategory">添加分类</el-button>
        </div>
        <el-table :data="categoryList" v-loading="categoryLoading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="code" label="代码" />
          <el-table-column prop="sortOrder" label="排序" width="100" />
          <el-table-column prop="isDefault" label="默认" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.isDefault === 1 ? 'success' : 'info'">
                {{ scope.row.isDefault === 1 ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                {{ scope.row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="handleEditCategory(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDeleteCategory(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分类编辑对话框 -->
        <el-dialog v-model="categoryDialogVisible" :title="categoryDialogTitle" width="500px">
          <el-form :model="categoryForm" label-width="100px">
            <el-form-item label="名称" required>
              <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
            </el-form-item>
            <el-form-item label="代码" required>
              <el-input v-model="categoryForm.code" placeholder="请输入分类代码（如：PACK）" />
            </el-form-item>
            <el-form-item label="排序">
              <el-input-number v-model="categoryForm.sortOrder" :min="0" />
            </el-form-item>
            <el-form-item label="默认显示">
              <el-switch v-model="categoryForm.isDefault" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="状态">
              <el-switch v-model="categoryForm.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="categoryDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSaveCategory">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { resourceApi } from '@/api/resource'
import { forumApi } from '@/api/forum'
import { categoryApi, type CategoryConfig } from '@/api/category'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi, type User, type Role, type RolePermission, type Permission } from '@/api/admin'

const router = useRouter()
const userStore = useUserStore()

// 根据权限设置默认激活的标签页
const getDefaultTab = () => {
  console.log(userStore)
  if (userStore.hasPermission('admin:user:read') || userStore.hasPermission('admin:user:manage')) {
    return 'users'
  }
  if (userStore.hasPermission('admin:resource:manage')) {
    return 'resources'
  }
  if (userStore.hasPermission('admin:post:manage')) {
    return 'posts'
  }
  if (userStore.hasPermission('admin:role:read') || userStore.hasPermission('admin:role:manage')) {
    return 'roles'
  }
  if (userStore.hasPermission('admin:category:manage')) {
    return 'categories'
  }
  return 'users'
}
const activeTab = ref(getDefaultTab())
const userLoading = ref(false)
const resourceLoading = ref(false)
const postLoading = ref(false)
const categoryLoading = ref(false)
const roleLoading = ref(false)
const userList = ref<User[]>([])
const userPage = ref(1)
const userPageSize = ref(10)
const userTotal = ref(0)
const userKeyword = ref('')
const resourceList = ref<any[]>([])
const postList = ref<any[]>([])
const categoryList = ref<CategoryConfig[]>([])
const roleList = ref<Role[]>([])
const categoryType = ref('RESOURCE')
const categoryDialogVisible = ref(false)
const userDirectPermissions = ref<Permission[]>([])
const permissionSources = ref<Record<string, string[]>>({})
const categoryDialogTitle = ref('添加分类')
const categoryForm = ref<Partial<CategoryConfig>>({
  name: '',
  code: '',
  type: 'RESOURCE',
  sortOrder: 0,
  isDefault: 0,
  status: 1
})
const roleDialogVisible = ref(false)
const roleEditDialogVisible = ref(false)
const roleDialogTitle = ref('添加角色')
const roleForm = ref<Partial<Role>>({
  name: '',
  code: '',
  description: '',
  status: 1
})
const rolePermissionDialogVisible = ref(false)
const currentRoleForPermission = ref<Role | null>(null)
const rolePermissions = ref<Permission[]>([])
const selectedRolePermissionIds = ref<number[]>([])
const rolePermissionTypeFilter = ref('')
const permissionTab = ref('roles')
const currentUserForRole = ref<User | null>(null)
const userRoles = ref<Role[]>([])
const allRoles = ref<Role[]>([])
const userPermissions = ref<Permission[]>([])
const allPermissions = ref<Permission[]>([])
const selectedRoleId = ref<number | null>(null)
const selectedPermissionIds = ref<number[]>([])
const permissionTypeFilter = ref('')

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger'
  }
  return types[status] || ''
}

const loadUsers = async () => {
  // 检查权限
  if (!userStore.hasPermission('admin:user:read') && !userStore.hasPermission('admin:user:manage')) {
    return
  }
  userLoading.value = true
  try {
    const result = await adminApi.getUserList({
      page: userPage.value,
      pageSize: userPageSize.value,
      keyword: userKeyword.value || undefined
    })
    userList.value = result.list
    userTotal.value = result.total
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    userLoading.value = false
  }
}

const handleUserPageSizeChange = () => {
  userPage.value = 1
  loadUsers()
}

const handleRoleChange = async (user: User) => {
  if (!userStore.hasPermission('admin:user:update') && !userStore.hasPermission('admin:user:manage')) {
    ElMessage.error('无权限执行此操作')
    await loadUsers() // 恢复原值
    return
  }
  try {
    await adminApi.updateUserRole(user.id, user.role)
    ElMessage.success('角色更新成功')
  } catch (error) {
    ElMessage.error('角色更新失败')
    // 恢复原值
    await loadUsers()
  }
}

const handleStatusChange = async (user: User) => {
  if (!userStore.hasPermission('admin:user:update') && !userStore.hasPermission('admin:user:manage')) {
    ElMessage.error('无权限执行此操作')
    await loadUsers() // 恢复原值
    return
  }
  try {
    await adminApi.updateUserStatus(user.id, user.status)
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
    // 恢复原值
    await loadUsers()
  }
}

const handleManageRoles = async (user: User) => {
  if (!userStore.hasPermission('admin:permission:manage')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  currentUserForRole.value = user
  roleDialogVisible.value = true
  permissionTab.value = 'roles'
  selectedRoleId.value = null
  selectedPermissionIds.value = []
  permissionTypeFilter.value = ''
  
  try {
    // 加载用户角色
    const roles = await adminApi.getUserRoles(user.id)
    userRoles.value = roles
    
    // 加载用户权限（包括通过角色获得的）
    const permissionsData = await adminApi.getUserPermissions(user.id)
    userPermissions.value = permissionsData.all
    userDirectPermissions.value = permissionsData.direct
    permissionSources.value = permissionsData.sources || {}
    
    // 加载所有可用角色
    const allRolesData = await adminApi.getAllRoles()
    allRoles.value = allRolesData.filter(r => r.status === 1)
    
    // 加载所有可用权限
    const allPermsData = await adminApi.getAllPermissions()
    allPermissions.value = allPermsData
  } catch (error) {
    ElMessage.error('加载权限信息失败')
  }
}

const isDirectPermission = (permissionId: number): boolean => {
  // 检查权限是否是直接分配的（不是通过角色获得的）
  return userDirectPermissions.value.some(p => p.id === permissionId)
}

const handleRemovePermission = async (permissionId: number) => {
  if (!currentUserForRole.value) return
  
  try {
    await ElMessageBox.confirm('确定要移除该权限吗？', '提示', {
      type: 'warning'
    })
    await adminApi.removePermissionFromUser(currentUserForRole.value.id, permissionId)
    ElMessage.success('权限移除成功')
    // 重新加载用户权限
    await handleManageRoles(currentUserForRole.value)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('权限移除失败')
    }
  }
}

const filteredPermissions = computed(() => {
  if (!permissionTypeFilter.value) {
    return allPermissions.value
  }
  return allPermissions.value.filter(p => p.type === permissionTypeFilter.value)
})

const handleAssignPermissions = async () => {
  if (!currentUserForRole.value || selectedPermissionIds.value.length === 0) {
    ElMessage.warning('请选择要分配的权限')
    return
  }
  
  try {
    // 过滤掉已经拥有的权限
    const userPermissionIds = userPermissions.value.map(p => p.id)
    const toAssign = selectedPermissionIds.value.filter(id => !userPermissionIds.includes(id))
    
    if (toAssign.length === 0) {
      ElMessage.warning('所选权限已全部拥有')
      return
    }
    
    // 批量分配权限
    for (const permissionId of toAssign) {
      try {
        await adminApi.assignPermissionToUser(currentUserForRole.value.id, permissionId)
      } catch (error: any) {
        console.error(`分配权限 ${permissionId} 失败:`, error)
      }
    }
    
    ElMessage.success(`成功分配 ${toAssign.length} 个权限`)
    selectedPermissionIds.value = []
    // 重新加载用户权限
    await handleManageRoles(currentUserForRole.value)
  } catch (error: any) {
    ElMessage.error('权限分配失败')
  }
}

const handleAssignRole = async () => {
  if (!selectedRoleId.value || !currentUserForRole.value) {
    ElMessage.warning('请选择角色')
    return
  }
  
  try {
    await adminApi.assignUserRole(currentUserForRole.value.id, selectedRoleId.value)
    ElMessage.success('角色分配成功')
    selectedRoleId.value = null
    // 重新加载用户角色和权限
    await handleManageRoles(currentUserForRole.value)
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '角色分配失败')
  }
}

const handleRemoveRole = async (roleId: number) => {
  if (!currentUserForRole.value) return
  
  try {
    await ElMessageBox.confirm('确定要移除该角色吗？', '提示', {
      type: 'warning'
    })
    await adminApi.removeUserRole(currentUserForRole.value.id, roleId)
    ElMessage.success('角色移除成功')
    // 重新加载用户角色和权限
    await handleManageRoles(currentUserForRole.value)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('角色移除失败')
    }
  }
}

const loadResources = async () => {
  if (!userStore.hasPermission('admin:resource:manage')) {
    return
  }
  resourceLoading.value = true
  try {
    const result = await resourceApi.getResourceList({ page: 1, pageSize: 100 })
    resourceList.value = result.list
  } catch (error) {
    ElMessage.error('加载资源列表失败')
  } finally {
    resourceLoading.value = false
  }
}

const loadPosts = async () => {
  if (!userStore.hasPermission('admin:post:manage')) {
    return
  }
  postLoading.value = true
  try {
    const result = await forumApi.getPostList({ page: 1, pageSize: 100 })
    postList.value = result.list
  } catch (error) {
    ElMessage.error('加载帖子列表失败')
  } finally {
    postLoading.value = false
  }
}

const loadCategories = async () => {
  if (!userStore.hasPermission('admin:category:manage')) {
    return
  }
  categoryLoading.value = true
  try {
    const configs = await categoryApi.getAllConfigs(categoryType.value)
    categoryList.value = configs
  } catch (error) {
    ElMessage.error('加载分类配置失败')
  } finally {
    categoryLoading.value = false
  }
}

const handleCategoryTypeChange = () => {
  categoryForm.value.type = categoryType.value
  loadCategories()
}

const handleAddCategory = () => {
  categoryDialogTitle.value = '添加分类'
  categoryForm.value = {
    name: '',
    code: '',
    type: categoryType.value,
    sortOrder: 0,
    isDefault: 0,
    status: 1
  }
  categoryDialogVisible.value = true
}

const handleEditCategory = (category: CategoryConfig) => {
  categoryDialogTitle.value = '编辑分类'
  categoryForm.value = { ...category }
  categoryDialogVisible.value = true
}

const handleSaveCategory = async () => {
  if (!categoryForm.value.name || !categoryForm.value.code) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    if (categoryForm.value.id) {
      await categoryApi.updateConfig(categoryForm.value.id, categoryForm.value)
      ElMessage.success('更新成功')
    } else {
      await categoryApi.createConfig(categoryForm.value as CategoryConfig)
      ElMessage.success('添加成功')
    }
    categoryDialogVisible.value = false
    loadCategories()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDeleteCategory = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个分类吗？', '提示', {
      type: 'warning'
    })
    await categoryApi.deleteConfig(id)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}


const handleViewResource = (id: number) => {
  router.push({ name: 'ResourceDetail', params: { id } })
}

const handleApproveResource = async (id: number) => {
  try {
    // 调用审核API
    ElMessage.success('审核通过')
    loadResources()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDeleteResource = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个资源吗？', '提示', {
      type: 'warning'
    })
    await resourceApi.deleteResource(id)
    ElMessage.success('删除成功')
    loadResources()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const handleViewPost = (id: number) => {
  router.push({ name: 'ForumPost', params: { id } })
}

const handleDeletePost = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个帖子吗？', '提示', {
      type: 'warning'
    })
    await forumApi.deletePost(id)
    ElMessage.success('删除成功')
    loadPosts()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const loadRoles = async () => {
  if (!userStore.hasPermission('admin:role:read') && !userStore.hasPermission('admin:role:manage')) {
    return
  }
  roleLoading.value = true
  try {
    const roles = await adminApi.getAllRoles()
    roleList.value = roles
  } catch (error) {
    ElMessage.error('加载角色列表失败')
  } finally {
    roleLoading.value = false
  }
}

const handleAddRole = () => {
  if (!userStore.hasPermission('admin:role:create') && !userStore.hasPermission('admin:role:manage')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  roleDialogTitle.value = '添加角色'
  roleForm.value = {
    name: '',
    code: '',
    description: '',
    status: 1
  }
  roleEditDialogVisible.value = true
}

const handleEditRole = (role: Role) => {
  if (!userStore.hasPermission('admin:role:update') && !userStore.hasPermission('admin:role:manage')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  roleDialogTitle.value = '编辑角色'
  roleForm.value = { ...role }
  roleEditDialogVisible.value = true
}

const handleSaveRole = async () => {
  if (!roleForm.value.name || !roleForm.value.code) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    if (roleForm.value.id) {
      await adminApi.updateRole(roleForm.value.id, roleForm.value)
      ElMessage.success('更新成功')
    } else {
      await adminApi.createRole(roleForm.value as Role)
      ElMessage.success('添加成功')
    }
    roleEditDialogVisible.value = false
    loadRoles()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const handleDeleteRole = async (roleId: number) => {
  if (!userStore.hasPermission('admin:role:delete') && !userStore.hasPermission('admin:role:manage')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  try {
    await ElMessageBox.confirm('确定要删除这个角色吗？', '提示', {
      type: 'warning'
    })
    await adminApi.deleteRole(roleId)
    ElMessage.success('删除成功')
    loadRoles()
  } catch (error: any) {
    if (error !== 'cancel') {
      const errorMsg = error.response?.data?.message || '删除失败'
      ElMessage.error(errorMsg)
    }
  }
}

const handleManageRolePermissions = async (role: Role) => {
  if (!userStore.hasPermission('admin:role:manage') && !userStore.hasPermission('admin:permission:manage')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  currentRoleForPermission.value = role
  rolePermissionDialogVisible.value = true
  selectedRolePermissionIds.value = []
  rolePermissionTypeFilter.value = ''
  
  try {
    // 加载角色权限
    const permissions = await adminApi.getRolePermissions(role.id)
    rolePermissions.value = permissions
    
    // 加载所有可用权限
    const allPermsData = await adminApi.getAllPermissions()
    allPermissions.value = allPermsData
  } catch (error) {
    ElMessage.error('加载权限信息失败')
  }
}

const filteredRolePermissions = computed(() => {
  if (!rolePermissionTypeFilter.value) {
    return allPermissions.value
  }
  return allPermissions.value.filter(p => p.type === rolePermissionTypeFilter.value)
})

const handleAssignRolePermissions = async () => {
  if (!currentRoleForPermission.value || selectedRolePermissionIds.value.length === 0) {
    ElMessage.warning('请选择要分配的权限')
    return
  }
  
  try {
    // 过滤掉已经拥有的权限
    const rolePermissionIds = rolePermissions.value.map(p => p.id)
    const toAssign = selectedRolePermissionIds.value.filter(id => !rolePermissionIds.includes(id))
    
    if (toAssign.length === 0) {
      ElMessage.warning('所选权限已全部拥有')
      return
    }
    
    // 批量分配权限
    for (const permissionId of toAssign) {
      try {
        await adminApi.assignPermissionToRole(currentRoleForPermission.value.id, permissionId)
      } catch (error: any) {
        console.error(`分配权限 ${permissionId} 失败:`, error)
      }
    }
    
    ElMessage.success(`成功分配 ${toAssign.length} 个权限`)
    selectedRolePermissionIds.value = []
    // 重新加载角色权限
    await handleManageRolePermissions(currentRoleForPermission.value)
  } catch (error: any) {
    ElMessage.error('权限分配失败')
  }
}

const handleRemoveRolePermission = async (permissionId: number) => {
  if (!currentRoleForPermission.value) return
  
  try {
    await ElMessageBox.confirm('确定要移除该权限吗？', '提示', {
      type: 'warning'
    })
    await adminApi.removePermissionFromRole(currentRoleForPermission.value.id, permissionId)
    ElMessage.success('权限移除成功')
    // 重新加载角色权限
    await handleManageRolePermissions(currentRoleForPermission.value)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('权限移除失败')
    }
  }
}

onMounted(() => {
  // 只加载有权限的数据
  if (userStore.hasPermission('admin:user:read') || userStore.hasPermission('admin:user:manage')) {
    loadUsers()
  }
  if (userStore.hasPermission('admin:resource:manage')) {
    loadResources()
  }
  if (userStore.hasPermission('admin:post:manage')) {
    loadPosts()
  }
  if (userStore.hasPermission('admin:category:manage')) {
    loadCategories()
  }
  if (userStore.hasPermission('admin:role:read') || userStore.hasPermission('admin:role:manage')) {
    loadRoles()
  }
})
</script>

<style scoped>
.admin-page {
  padding: 20px 0;
}
</style>

