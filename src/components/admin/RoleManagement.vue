<template>
  <div class="role-management">
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div></div>
      <el-button 
        type="primary" 
        @click="handleAddRole" 
        v-if="userStore.hasPermission('admin:role:create')"
      >
        添加角色
      </el-button>
    </div>
    <el-table :data="roleList" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="角色名称" align="center" />
      <el-table-column prop="code" label="角色代码" align="center" />
      <el-table-column prop="description" label="描述" align="center" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" align="center">
        <template #default="scope">
          {{ scope.row.createTime ? formatDateTime(scope.row.createTime) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" align="center">
        <template #default="scope">
          <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
            <el-button 
              size="small" 
              @click="handleEditRole(scope.row)" 
              v-if="userStore.hasPermission('admin:role:update')"
            >
              编辑
            </el-button>
            <el-button 
              size="small" 
              @click="handleManageRolePermissions(scope.row)" 
              v-if="userStore.hasPermission('admin:role:update')"
            >
              分配权限
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDeleteRole(scope.row.id)" 
              v-if="userStore.hasPermission('admin:role:delete')"
            >
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 角色编辑对话框 -->
    <el-dialog v-model="editDialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="角色名称" required>
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色代码" required>
          <el-input v-model="form.code" placeholder="请输入角色代码（如：MODERATOR）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRole">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 角色权限管理对话框 -->
    <RolePermissionDialog
      v-model="permissionDialogVisible"
      :role="currentRoleForPermission"
      @refresh="loadRoles"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { adminApi, type Role } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '@/utils/admin'
import RolePermissionDialog from './RolePermissionDialog.vue'

const userStore = useUserStore()

const loading = ref(false)
const roleList = ref<Role[]>([])

const editDialogVisible = ref(false)
const dialogTitle = ref('添加角色')
const form = ref<Partial<Role>>({
  name: '',
  code: '',
  description: '',
  status: 1
})

const permissionDialogVisible = ref(false)
const currentRoleForPermission = ref<Role | null>(null)

// 是否已加载过数据（防止重复加载）
const hasLoaded = ref(false)

const loadRoles = async () => {
  if (!userStore.hasPermission('admin:role:read')) {
    return
  }
  loading.value = true
  try {
    const roles = await adminApi.getAllRoles()
    roleList.value = roles
  } catch (error) {
    ElMessage.error('加载角色列表失败')
  } finally {
    loading.value = false
    hasLoaded.value = true
  }
}

const handleAddRole = () => {
  if (!userStore.hasPermission('admin:role:create')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  dialogTitle.value = '添加角色'
  form.value = {
    name: '',
    code: '',
    description: '',
    status: 1
  }
  editDialogVisible.value = true
}

const handleEditRole = (role: Role) => {
  if (!userStore.hasPermission('admin:role:update')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  dialogTitle.value = '编辑角色'
  form.value = { ...role }
  editDialogVisible.value = true
}

const handleSaveRole = async () => {
  if (!form.value.name || !form.value.code) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    if (form.value.id) {
      if (!userStore.hasPermission('admin:role:update')) {
        ElMessage.error('无权限执行此操作')
        return
      }
      await adminApi.updateRole(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      if (!userStore.hasPermission('admin:role:create')) {
        ElMessage.error('无权限执行此操作')
        return
      }
      await adminApi.createRole(form.value)
      ElMessage.success('添加成功')
    }
    editDialogVisible.value = false
    loadRoles()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const handleDeleteRole = async (id: number) => {
  if (!userStore.hasPermission('admin:role:delete')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要删除这个角色吗？删除后相关用户的权限可能会受到影响。', '提示', {
      type: 'warning'
    })
    await adminApi.deleteRole(id)
    ElMessage.success('删除成功')
    loadRoles()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

const handleManageRolePermissions = (role: Role) => {
  if (!userStore.hasPermission('admin:role:update')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  currentRoleForPermission.value = role
  permissionDialogVisible.value = true
}

onMounted(() => {
  // 懒加载：只在组件挂载且未加载过时加载数据
  if (userStore.hasPermission('admin:role:read') && !hasLoaded.value) {
    loadRoles()
  }
})
</script>

<style scoped>
.role-management {
  width: 100%;
}
</style>

