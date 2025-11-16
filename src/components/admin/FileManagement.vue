<template>
  <div class="file-management">
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <el-input
        v-model="keyword"
        placeholder="搜索文件名"
        style="width: 300px"
        clearable
        @clear="loadFiles"
        @keyup.enter="loadFiles"
      >
        <template #append>
          <el-button @click="loadFiles">搜索</el-button>
        </template>
      </el-input>
    </div>
    <el-table :data="fileList" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="originalName" label="文件名" align="center" />
      <el-table-column prop="fileSize" label="文件大小" width="120" align="center">
        <template #default="scope">
          {{ formatFileSize(scope.row.fileSize) }}
        </template>
      </el-table-column>
      <el-table-column prop="fileType" label="文件类型" width="120" align="center" />
      <el-table-column prop="resourceId" label="资源ID" width="100" align="center">
        <template #default="scope">
          <span v-if="scope.row.resourceId">{{ scope.row.resourceId }}</span>
          <span v-else style="color: #999;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="上传时间" align="center">
        <template #default="scope">
          {{ formatDateTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center">
        <template #default="scope">
          <el-button
            size="small"
            type="danger"
            @click="handleDeleteFile(scope.row.id)"
            v-if="userStore.hasPermission('admin:file:delete') || userStore.hasPermission('admin:file:manage')"
          >
            删除
          </el-button>
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
      @current-change="loadFiles"
      @size-change="handlePageSizeChange"
      style="margin-top: 20px; justify-content: flex-end"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { adminApi, type SysFile } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime, formatFileSize } from '@/utils/admin'

const userStore = useUserStore()

const loading = ref(false)
const fileList = ref<SysFile[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const keyword = ref('')

const canAccess = computed(() => {
  return userStore.hasPermission('admin:file:read') || userStore.hasPermission('admin:file:manage')
})

// 是否已加载过数据（防止重复加载）
const hasLoaded = ref(false)

const loadFiles = async () => {
  if (!canAccess.value) {
    return
  }
  loading.value = true
  try {
    const result = await adminApi.getFileList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined
    })
    fileList.value = result.list
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载文件列表失败')
  } finally {
    loading.value = false
    hasLoaded.value = true
  }
}

const handlePageSizeChange = () => {
  page.value = 1
  loadFiles()
}

const handleDeleteFile = async (id: number) => {
  if (!userStore.hasPermission('admin:file:delete') && !userStore.hasPermission('admin:file:manage')) {
    ElMessage.error('无权限执行此操作')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要删除该文件吗？', '提示', {
      type: 'warning'
    })
    await adminApi.deleteFile(id)
    ElMessage.success('删除成功')
    
    // 如果当前页没有数据了，返回上一页
    if (fileList.value.length === 1 && page.value > 1) {
      page.value--
    }
    loadFiles()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

onMounted(() => {
  // 懒加载：只在组件挂载且未加载过时加载数据
  if (canAccess.value && !hasLoaded.value) {
    loadFiles()
  }
})
</script>

<style scoped>
.file-management {
  width: 100%;
}
</style>

