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
        v-if="userStore.hasPermission('admin:permission:create')"
      >
        添加权限
      </el-button>
    </div>
    <el-table :data="permissionList" v-loading="loading" style="width: 100%" :cell-style="{ padding: '8px' }">
      <el-table-column prop="id" label="ID" width="60" align="center" />
      <el-table-column prop="code" label="权限代码" width="150" align="center" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ scope.row.code }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="权限名称" width="150" align="center" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.type === 'PAGE' ? 'success' : 'info'" size="small">
            {{ scope.row.type === 'PAGE' ? '页面访问' : '操作权限' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" width="180" align="center" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ scope.row.description || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="router" label="路由地址" width="150" align="center" show-overflow-tooltip>
        <template #default="scope">
          <span v-if="scope.row.router">{{ scope.row.router }}</span>
          <span v-else style="color: #999;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="apiurl" label="API地址" width="200" align="center" show-overflow-tooltip>
        <template #default="scope">
          <span v-if="scope.row.apiurl">
            <el-tag size="small" :type="getMethodTypeColor(scope.row.methodtype)" style="margin-right: 4px;">
              {{ scope.row.methodtype || 'GET' }}
            </el-tag>
            <span>{{ scope.row.apiurl }}</span>
          </span>
          <span v-else style="color: #999;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="parentId" label="父权限ID" width="90" align="center">
        <template #default="scope">
          <span v-if="scope.row.parentId && scope.row.parentId !== 0">{{ scope.row.parentId }}</span>
          <span v-else style="color: #999;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="70" align="center" />
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160" align="center" show-overflow-tooltip>
        <template #default="scope">
          {{ formatDateTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template #default="scope">
          <div style="display: flex; justify-content: center; gap: 8px;">
            <el-button
              size="small"
              @click="handleEditPermission(scope.row)"
              v-if="userStore.hasPermission('admin:permission:update')"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDeletePermission(scope.row.id)"
              v-if="userStore.hasPermission('admin:permission:delete')"
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
        <el-form-item label="路由地址" v-if="form.type === 'PAGE'">
          <el-input v-model="form.router" placeholder="例如：/admin/users" />
        </el-form-item>
        <el-form-item label="API地址" v-if="form.type === 'ACTION'">
          <el-select
            :model-value="form.apiurl && form.methodtype ? `${form.methodtype}:${form.apiurl}` : ''"
            placeholder="请选择API地址"
            filterable
            clearable
            style="width: 100%"
            @change="handleApiUrlChange"
          >
            <el-option
              v-for="api in apiList"
              :key="`${api.method}-${api.url}`"
              :label="api.displayName || `${api.method} ${api.url}`"
              :value="`${api.method}:${api.url}`"
            >
              <el-tooltip
                :content="api.description || api.summary || `${api.method} ${api.url}`"
                placement="top"
                :show-after="300"
              >
                <div style="width: 100%;">
                  <el-tag size="small" :type="getMethodTypeColor(api.method)" style="margin-right: 8px;">
                    {{ api.method }}
                  </el-tag>
                  <span>{{ api.url }}</span>
                  <div style="color: #999; font-size: 12px; margin-top: 4px;">{{ api.summary }}</div>
                </div>
              </el-tooltip>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="请求方式" v-if="form.type === 'ACTION' && form.apiurl">
          <el-select v-model="form.methodtype" placeholder="请求方式" disabled>
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
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
import { ref, onMounted, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { adminApi, type Permission, type ApiInfo } from '@/api/admin'
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
  router: '',
  apiurl: '',
  methodtype: '',
  parentId: 0,
  sortOrder: 0,
  status: 1
})
const apiList = ref<ApiInfo[]>([])
const loadingApis = ref(false)

const canAccess = computed(() => {
  return userStore.hasPermission('admin:permission:read')
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
  if (!userStore.hasPermission('admin:permission:create')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  dialogTitle.value = '添加权限'
  form.value = {
    code: '',
    name: '',
    type: 'PAGE',
    description: '',
    router: '',
    apiurl: '',
    methodtype: '',
    parentId: 0,
    sortOrder: 0,
    status: 1
  }
  dialogVisible.value = true
}

const handleEditPermission = (permission: Permission) => {
  if (!userStore.hasPermission('admin:permission:update')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  dialogTitle.value = '编辑权限'
  form.value = { ...permission }
  dialogVisible.value = true
}

const handleApiUrlChange = (value: string) => {
  if (value) {
    // value格式为 "METHOD:URL"，需要解析
    const [method, ...urlParts] = value.split(':')
    const url = urlParts.join(':') // 处理URL中包含冒号的情况
    
    // 根据选择的API方法和URL，自动设置methodtype、描述和权限名称
    const selectedApi = apiList.value.find(api => api.method === method && api.url === url)
    if (selectedApi) {
      form.value.methodtype = selectedApi.method
      form.value.apiurl = selectedApi.url
      // 自动填充描述
      if (selectedApi.description) {
        form.value.description = selectedApi.description
      }
      // 自动填充权限名称（使用summary，如果没有则使用description）
      if (selectedApi.summary && !form.value.name) {
        form.value.name = selectedApi.summary
      } else if (selectedApi.description && !form.value.name) {
        // 如果summary为空，尝试从description中提取
        form.value.name = selectedApi.description.split('，')[0] || selectedApi.description
      }
    }
  } else {
    form.value.methodtype = ''
    form.value.apiurl = ''
  }
}

const loadAllApis = async () => {
  if (loadingApis.value) return
  loadingApis.value = true
  try {
    const apis = await adminApi.getAllApis()
    // 为每个API添加displayName
    apiList.value = apis.map(api => ({
      ...api,
      displayName: api.summary ? `${api.summary} (${api.method} ${api.url})` : `${api.method} ${api.url}`
    }))
  } catch (error: any) {
    console.error('加载API列表失败:', error)
    ElMessage.error(error.response?.data?.message || '加载API列表失败')
  } finally {
    loadingApis.value = false
  }
}

const getMethodTypeColor = (method?: string) => {
  if (!method) return 'info'
  switch (method.toUpperCase()) {
    case 'GET':
      return 'success'
    case 'POST':
      return 'primary'
    case 'PUT':
      return 'warning'
    case 'DELETE':
      return 'danger'
    default:
      return 'info'
  }
}

const handleSavePermission = async () => {
  if (!form.value.code || !form.value.name) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    if (form.value.id) {
      if (!userStore.hasPermission('admin:permission:update')) {
        ElMessage.error('无权限执行此操作')
        return
      }
      await adminApi.updatePermission(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      if (!userStore.hasPermission('admin:permission:create')) {
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

// 监听对话框打开，如果是操作权限类型，加载API列表
watch(dialogVisible, (visible) => {
  if (visible && form.value.type === 'ACTION') {
    if (apiList.value.length === 0) {
      loadAllApis()
    }
  }
})

// 监听权限类型变化
watch(() => form.value.type, (newType) => {
  if (newType === 'ACTION' && apiList.value.length === 0) {
    loadAllApis()
  }
  // 切换类型时清空相关字段
  if (newType === 'PAGE') {
    form.value.apiurl = ''
    form.value.methodtype = ''
  } else {
    form.value.router = ''
  }
})

const handleDeletePermission = async (id: number) => {
  if (!userStore.hasPermission('admin:permission:delete')) {
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

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th) {
  padding: 8px 0;
  font-weight: 600;
}

:deep(.el-table td) {
  padding: 8px 0;
}

:deep(.el-table .cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 8px;
}
</style>

