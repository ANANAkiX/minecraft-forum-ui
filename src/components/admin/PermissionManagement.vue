<template>
  <div class="permission-management">
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <el-input
          v-model="keyword"
          placeholder="搜索权限名称或权限代码"
          style="width: 300px"
          clearable
          @clear="loadPermissions"
          @keyup.enter="loadPermissions"
        >
          <template #append>
            <el-button @click="loadPermissions">搜索</el-button>
          </template>
        </el-input>
        <el-select v-model="typeFilter" placeholder="权限类型筛选" clearable style="width: 200px" @change="loadPermissions">
          <el-option label="全部" value="" />
          <el-option label="页面访问" value="PAGE" />
          <el-option label="操作权限" value="ACTION" />
        </el-select>
      </div>
      <el-button
        type="primary"
        @click="handleAddPermission"
        v-if="userStore.hasPermission('admin:permission:create') || userStore.hasPermission('admin:permission:manage')"
      >
        添加权限
      </el-button>
    </div>
    <el-table :data="permissionList" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="code" label="权限代码" align="center" />
      <el-table-column prop="name" label="权限名称" align="center" />
      <el-table-column prop="type" label="类型" width="120" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.type === 'PAGE' ? 'success' : 'info'">
            {{ scope.row.type === 'PAGE' ? '页面访问' : '操作权限' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" align="center" />
      <el-table-column prop="parentId" label="父权限ID" width="120" align="center">
        <template #default="scope">
          <span v-if="scope.row.parentId && scope.row.parentId !== 0">{{ scope.row.parentId }}</span>
          <span v-else style="color: #999;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="100" align="center" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" align="center">
        <template #default="scope">
          {{ formatDateTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="scope">
          <div style="display: flex; justify-content: center; gap: 8px;">
            <el-button
              size="small"
              @click="handleEditPermission(scope.row)"
              v-if="userStore.hasPermission('admin:permission:update') || userStore.hasPermission('admin:permission:manage')"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDeletePermission(scope.row.id)"
              v-if="userStore.hasPermission('admin:permission:delete') || userStore.hasPermission('admin:permission:manage')"
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
      @current-change="loadPermissions"
      @size-change="handlePageSizeChange"
      style="margin-top: 20px; justify-content: flex-end"
    />

    <!-- 权限编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="权限代码" required>
          <el-input v-model="form.code" placeholder="例如：page:admin" />
        </el-form-item>
        <el-form-item label="权限名称" required>
          <el-input v-model="form.name" placeholder="例如：访问后台管理" />
        </el-form-item>
        <el-form-item label="权限类型" required>
          <el-select v-model="form.type" placeholder="请选择权限类型">
            <el-option label="页面访问" value="PAGE" />
            <el-option label="操作权限" value="ACTION" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入权限描述" />
        </el-form-item>
        <el-form-item label="父权限ID">
          <el-input-number v-model="form.parentId" :min="0" placeholder="0表示顶级权限" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePermission">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { adminApi, type Permission } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '@/utils/admin'

const userStore = useUserStore()

const loading = ref(false)
const permissionList = ref<Permission[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const keyword = ref('')
const typeFilter = ref('')

const dialogVisible = ref(false)
const dialogTitle = ref('添加权限')
const form = ref<Partial<Permission>>({
  code: '',
  name: '',
  type: 'PAGE',
  description: '',
  parentId: 0,
  sortOrder: 0,
  status: 1
})

const canAccess = computed(() => {
  return userStore.hasPermission('admin:permission:read') || userStore.hasPermission('admin:permission:manage')
})

const loadPermissions = async () => {
  if (!canAccess.value) {
    return
  }
  loading.value = true
  try {
    const result = await adminApi.getPermissionList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      type: typeFilter.value || undefined
    })
    permissionList.value = result.list
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载权限列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageSizeChange = () => {
  page.value = 1
  loadPermissions()
}

const handleAddPermission = () => {
  if (!userStore.hasPermission('admin:permission:create') && !userStore.hasPermission('admin:permission:manage')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  dialogTitle.value = '添加权限'
  form.value = {
    code: '',
    name: '',
    type: 'PAGE',
    description: '',
    parentId: 0,
    sortOrder: 0,
    status: 1
  }
  dialogVisible.value = true
}

const handleEditPermission = (permission: Permission) => {
  if (!userStore.hasPermission('admin:permission:update') && !userStore.hasPermission('admin:permission:manage')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  dialogTitle.value = '编辑权限'
  form.value = { ...permission }
  dialogVisible.value = true
}

const handleSavePermission = async () => {
  if (!form.value.code || !form.value.name) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    if (form.value.id) {
      if (!userStore.hasPermission('admin:permission:update') && !userStore.hasPermission('admin:permission:manage')) {
        ElMessage.error('无权限执行此操作')
        return
      }
      await adminApi.updatePermission(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      if (!userStore.hasPermission('admin:permission:create') && !userStore.hasPermission('admin:permission:manage')) {
        ElMessage.error('无权限执行此操作')
        return
      }
      await adminApi.createPermission(form.value)
      ElMessage.success('添加成功')
      page.value = 1
    }
    dialogVisible.value = false
    loadPermissions()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const handleDeletePermission = async (id: number) => {
  if (!userStore.hasPermission('admin:permission:delete') && !userStore.hasPermission('admin:permission:manage')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要删除该权限吗？', '提示', {
      type: 'warning'
    })
    await adminApi.deletePermission(id)
    ElMessage.success('删除成功')
    
    // 如果当前页没有数据了，返回上一页
    if (permissionList.value.length === 1 && page.value > 1) {
      page.value--
    }
    loadPermissions()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

onMounted(() => {
  if (canAccess.value) {
    loadPermissions()
  }
})
</script>

<style scoped>
.permission-management {
  width: 100%;
}
</style>

