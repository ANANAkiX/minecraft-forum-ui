<template>
  <div class="user-management">
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <el-input
        v-model="keyword"
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
      <el-button 
        type="primary" 
        @click="handleAddUser"
        v-if="userStore.hasPermission('admin:user:create')"
      >
        添加用户
      </el-button>
    </div>
    <el-table :data="userList" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="username" label="用户名" align="center" />
      <el-table-column prop="nickname" label="昵称" align="center" />
      <el-table-column prop="email" label="邮箱" align="center" />
      <el-table-column prop="status" label="状态" width="100" align="center">
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
      <el-table-column prop="createTime" label="注册时间" align="center">
        <template #default="scope">
          {{ formatDateTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="350" align="center">
        <template #default="scope">
          <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
            <el-button 
              size="small" 
              @click="handleEditUser(scope.row)"
              v-if="userStore.hasPermission('admin:user:update')"
            >
              编辑
            </el-button>
            <el-button 
              size="small" 
              @click="handleManageRoles(scope.row)"
              v-if="userStore.hasPermission('admin:user:update')"
            >
              角色管理
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDeleteUser(scope.row.id)"
              v-if="userStore.hasPermission('admin:user:delete')"
            >
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-if="total > 0"
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next, sizes"
      :page-sizes="[10, 20, 50, 100]"
      @current-change="loadUsers"
      @size-change="handlePageSizeChange"
      style="margin-top: 20px; justify-content: flex-end"
    />
    
    <!-- 用户角色管理对话框 -->
    <UserRoleDialog
      v-model="roleDialogVisible"
      :user="currentUserForRole"
      @refresh="loadUsers"
    />
    
    <!-- 用户编辑对话框 -->
    <el-dialog v-model="userEditDialogVisible" :title="userEditDialogTitle" width="500px">
      <el-form :model="userForm" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="!!userForm.id" />
        </el-form-item>
        <el-form-item label="昵称" required>
          <el-input v-model="userForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="userForm.status" :active-value="0" :inactive-value="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userEditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { adminApi, type User } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '@/utils/admin'
import UserRoleDialog from './UserRoleDialog.vue'

const userStore = useUserStore()

const loading = ref(false)
const userList = ref<User[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const keyword = ref('')

const roleDialogVisible = ref(false)
const currentUserForRole = ref<User | null>(null)

const userEditDialogVisible = ref(false)
const userEditDialogTitle = ref('添加用户')
const userForm = ref<Partial<User>>({
  username: '',
  nickname: '',
  email: '',
  role: 'USER',
  status: 0
})

const loadUsers = async () => {
  if (!userStore.hasPermission('admin:user:read')) {
    return
  }
  loading.value = true
  try {
    const result = await adminApi.getUserList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined
    })
    userList.value = result.list
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageSizeChange = () => {
  page.value = 1
  loadUsers()
}

const handleStatusChange = async (user: User) => {
  if (!userStore.hasPermission('admin:user:update')) {
    ElMessage.error('无权限执行此操作')
    await loadUsers()
    return
  }
  try {
    await adminApi.updateUserStatus(user.id, user.status)
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
    await loadUsers()
  }
}

const handleAddUser = () => {
  if (!userStore.hasPermission('admin:user:create')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  userEditDialogTitle.value = '添加用户'
  userForm.value = {
    username: '',
    nickname: '',
    email: '',
    status: 0
  }
  userEditDialogVisible.value = true
}

const handleEditUser = (user: User) => {
  if (!userStore.hasPermission('admin:user:update')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  userEditDialogTitle.value = '编辑用户'
  userForm.value = {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    status: user.status
  }
  userEditDialogVisible.value = true
}

const handleSaveUser = async () => {
  if (!userForm.value.username || !userForm.value.email) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    if (userForm.value.id) {
      if (!userStore.hasPermission('admin:user:update')) {
        ElMessage.error('无权限执行此操作')
        return
      }
      await adminApi.updateUserInfo(userForm.value.id, {
        nickname: userForm.value.nickname,
        email: userForm.value.email,
        status: userForm.value.status
      })
      ElMessage.success('用户更新成功')
    } else {
      ElMessage.warning('创建用户功能需要后端API支持')
    }
    userEditDialogVisible.value = false
    loadUsers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const handleDeleteUser = async (_userId: number) => {
  if (!userStore.hasPermission('admin:user:delete')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
      type: 'warning'
    })
    ElMessage.warning('删除用户功能需要后端API支持')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleManageRoles = (user: User) => {
  if (!userStore.hasPermission('admin:user:update')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  currentUserForRole.value = user
  roleDialogVisible.value = true
}

onMounted(() => {
  if (userStore.hasPermission('admin:user:read')) {
    loadUsers()
  }
})
</script>

<style scoped>
.user-management {
  width: 100%;
}
</style>

