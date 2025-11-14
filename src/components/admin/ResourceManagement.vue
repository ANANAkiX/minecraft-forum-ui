<template>
  <div class="resource-management">
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <el-input
        v-model="keyword"
        placeholder="搜索标题、描述"
        style="width: 300px"
        clearable
        @clear="loadResources"
        @keyup.enter="loadResources"
      >
        <template #append>
          <el-button @click="loadResources">搜索</el-button>
        </template>
      </el-input>
      <div style="display: flex; gap: 10px; align-items: center;">
        <el-select v-model="category" placeholder="分类筛选" clearable style="width: 150px" @change="loadResources">
          <el-option label="全部" value="" />
          <el-option label="整合包" value="PACK" />
          <el-option label="MOD" value="MOD" />
          <el-option label="资源包" value="RESOURCE" />
        </el-select>
        <el-select v-model="status" placeholder="状态筛选" clearable style="width: 150px" @change="loadResources">
          <el-option label="全部" value="" />
          <el-option label="待审核" value="PENDING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="已拒绝" value="REJECTED" />
        </el-select>
        <el-select v-model="sortBy" placeholder="排序方式" style="width: 150px" @change="loadResources">
          <el-option label="发布时间" value="createTime" />
          <el-option label="下载量" value="downloadCount" />
          <el-option label="点赞量" value="likeCount" />
        </el-select>
      </div>
    </div>
    <el-table 
      :data="resourceList" 
      v-loading="loading" 
      style="width: 100%"
      @row-click="(row: any) => handleViewResource(row.id)"
      class="clickable-table"
    >
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="title" label="标题" align="center" />
      <el-table-column prop="authorName" label="作者" align="center" />
      <el-table-column prop="category" label="分类" align="center" />
      <el-table-column prop="status" label="状态" align="center" width="150">
        <template #default="scope">
          <el-select
            v-model="scope.row.status"
            size="small"
            @change="handleResourceStatusChange(scope.row)"
            @click.stop
            v-if="userStore.hasPermission('admin:resource:update')"
            style="width: 120px"
          >
            <el-option label="待审核" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已拒绝" value="REJECTED" />
          </el-select>
          <el-tag v-else :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="发布时间" align="center">
        <template #default="scope">
          {{ formatDateTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="scope">
          <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
            <el-button
              size="small"
              @click.stop="handleEditResource(scope.row)"
              v-if="userStore.hasPermission('admin:resource:update')"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click.stop="handleDeleteResource(scope.row.id)"
              v-if="userStore.hasPermission('admin:resource:delete')"
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
      @current-change="loadResources"
      @size-change="handlePageSizeChange"
      style="margin-top: 20px; justify-content: flex-end"
    />
    
    <!-- 资源编辑对话框 - 全屏编辑页面 -->
    <ResourceEditDialog
      v-model="editDialogVisible"
      :resource="currentResource"
      @refresh="loadResources"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { adminApi } from '@/api/admin'
import { resourceApi } from '@/api/resource'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime, getStatusType, getStatusText } from '@/utils/admin'
import ResourceEditDialog from './ResourceEditDialog.vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const resourceList = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const keyword = ref('')
const category = ref('')
const status = ref('')
const sortBy = ref('createTime')

const editDialogVisible = ref(false)
const currentResource = ref<any>(null)

const loadResources = async () => {
  if (!userStore.hasPermission('admin:resource:read')) {
    return
  }
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    if (category.value) {
      params.category = category.value
    }
    if (status.value) {
      params.status = status.value
    }
    const result = await adminApi.getAllResources(params)
    resourceList.value = result.list
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载资源列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageSizeChange = () => {
  page.value = 1
  loadResources()
}

const handleViewResource = (id: number) => {
  router.push({ name: 'ResourceDetail', params: { id } })
}

const handleResourceStatusChange = async (resource: any) => {
  try {
    await adminApi.updateResource(resource.id, {
      status: resource.status
    })
    ElMessage.success('状态更新成功')
    loadResources()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '状态更新失败')
    await loadResources()
  }
}

const handleEditResource = (resource: any) => {
  currentResource.value = resource
  editDialogVisible.value = true
}

const handleDeleteResource = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个资源吗？', '提示', {
      type: 'warning'
    })
    await resourceApi.deleteResource(id)
    ElMessage.success('删除成功')
    
    if (resourceList.value.length === 1 && page.value > 1) {
      page.value--
    }
    loadResources()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

onMounted(() => {
  if (userStore.hasPermission('admin:resource:read')) {
    loadResources()
  }
})
</script>

<script lang="ts">
import { ElMessageBox } from 'element-plus'
import { resourceApi } from '@/api/resource'
export default {
  name: 'ResourceManagement'
}
</script>

<style scoped>
.resource-management {
  width: 100%;
}

.clickable-table :deep(tbody tr) {
  cursor: pointer;
}
</style>

