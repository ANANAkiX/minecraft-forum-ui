<template>
  <div class="resource-detail" v-loading="loading">
    <el-card v-if="resource">
      <template #header>
        <div class="header">
          <h1>{{ resource.title }}</h1>
          <div class="actions">
            <el-button
              :type="isLiked ? 'danger' : 'default'"
              :icon="isLiked ? 'Star' : 'Star'"
              @click="handleLike"
            >
              {{ isLiked ? '已点赞' : '点赞' }} {{ resource.likeCount }}
            </el-button>
            <el-button
              :type="isFavorited ? 'warning' : 'default'"
              :icon="isFavorited ? 'StarFilled' : 'Star'"
              @click="handleFavorite"
            >
              {{ isFavorited ? '已收藏' : '收藏' }} {{ resource.favoriteCount }}
            </el-button>
            <el-tooltip
              content="暂无下载权限，请联系管理员"
              placement="top"
              :disabled="hasDownloadPermission || files.length === 0"
            >
              <el-button 
                type="primary" 
                :icon="Download" 
                @click="handleDownloadAll()"
                :disabled="!hasDownloadPermission || files.length === 0"
                :loading="downloadingAll"
              >
                下载所有文件 {{ files.length > 0 ? `(${files.length})` : '' }}
            </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>
      <div class="content">
        <div class="meta">
          <div class="meta-item">
            <el-avatar :src="resource.authorAvatar">{{ resource.authorName }}</el-avatar>
            <span class="author">{{ resource.authorName }}</span>
          </div>
          <div class="meta-item">
            <el-tag type="success">{{ resource.category }}</el-tag>
            <el-tag>{{ resource.version }}</el-tag>
          </div>
          <div class="meta-item">
            <span>发布时间：{{ formatTime(resource.createTime) }}</span>
          </div>
        </div>
        <div class="description">
          <h3>简介</h3>
          <p>{{ resource.description }}</p>
        </div>
        <div class="tags" v-if="resource.tags.length">
          <h3>标签</h3>
          <el-tag
            v-for="tag in resource.tags"
            :key="tag"
            style="margin-right: 8px; margin-bottom: 8px;"
          >
            {{ tag }}
          </el-tag>
        </div>
        <div class="files" v-if="files.length > 0">
          <h3>资源文件</h3>
          <el-table :data="files" style="width: 100%">
            <el-table-column prop="originalName" label="文件名">
              <template #default="{ row }">
                <el-tooltip
                  content="暂无下载权限，请联系管理员"
                  placement="top"
                  :disabled="hasDownloadPermission"
                >
                  <span 
                    class="file-name-link"
                    :class="{ 'disabled': !hasDownloadPermission }"
                    @click="handleDownloadSingle(row)"
                    :title="hasDownloadPermission ? '点击下载' : '暂无下载权限，请联系管理员'"
                  >
                    {{ row.originalName }}
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="fileSize" label="文件大小" width="120">
              <template #default="{ row }">
                {{ formatFileSize(row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column prop="fileType" label="文件类型" width="120" />
          </el-table>
        </div>
        <div class="markdown-content" v-if="resource.content">
          <h3>详细介绍</h3>
          <div v-html="markdownToHtml(resource.content)"></div>
        </div>
      </div>
    </el-card>
    <el-empty v-else description="资源不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { resourceApi, type Resource } from '@/api/resource'
import { fileApi, type SysFile } from '@/api/file'
import { useUserStore } from '@/stores/user'
import { usePageTitle } from '@/composables/usePageTitle'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const userStore = useUserStore()
const pageTitle = usePageTitle()

const loading = ref(false)
const resource = ref<Resource | null>(null)
const files = ref<SysFile[]>([])
const isLiked = ref(false)
const isFavorited = ref(false)
const downloadingAll = ref(false)

// 检查是否有下载权限
const hasDownloadPermission = computed(() => {
  return userStore.hasPermission('resource:download')
})

const md = new MarkdownIt()

const markdownToHtml = (content: string) => {
  return md.render(content)
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
}

const loadResource = async () => {
  const id = parseInt(route.params.id as string)
  if (!id) return
  
  loading.value = true
  try {
    resource.value = await resourceApi.getResourceById(id)
    // 设置页面标题，保存ID用于跳转
    if (resource.value) {
      pageTitle.setResourceTitle(resource.value.title, resource.value.id)
      
      // 从后端返回的数据中获取点赞和收藏状态
      isLiked.value = resource.value.isLiked ?? false
      isFavorited.value = resource.value.isFavorited ?? false
    }
    
    // 加载资源关联的文件列表
    try {
      files.value = await fileApi.getFilesByResourceId(id)
    } catch (error) {
      console.error('加载文件列表失败:', error)
      files.value = []
    }
  } catch (error) {
    ElMessage.error('加载资源失败')
  } finally {
    loading.value = false
  }
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (!resource.value) return
  
  try {
    if (isLiked.value) {
      await resourceApi.unlikeResource(resource.value.id)
      isLiked.value = false
      if (resource.value) resource.value.likeCount--
    } else {
      await resourceApi.likeResource(resource.value.id)
      isLiked.value = true
      if (resource.value) resource.value.likeCount++
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (!resource.value) return
  
  try {
    if (isFavorited.value) {
      await resourceApi.unfavoriteResource(resource.value.id)
      isFavorited.value = false
      if (resource.value) resource.value.favoriteCount--
    } else {
      await resourceApi.favoriteResource(resource.value.id)
      isFavorited.value = true
      if (resource.value) resource.value.favoriteCount++
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 下载单个文件
const handleDownloadSingle = async (file: SysFile) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  // 检查下载权限
  if (!hasDownloadPermission.value) {
    ElMessage.warning('暂无下载权限，请联系管理员')
    return
  }
  
  if (!resource.value || !file || !file.id) {
    ElMessage.warning('文件不存在')
    return
  }
  
  try {
    // 先记录下载日志（只记录一次）
    await resourceApi.downloadResource(resource.value.id)
    if (resource.value) resource.value.downloadCount++
    
    // 通过后端接口下载文件
    const blob = await fileApi.downloadFile(file.id)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.originalName || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('下载成功')
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || '下载失败'
    ElMessage.error(errorMessage)
    console.error('下载失败:', error)
  }
}

// 下载所有文件
const handleDownloadAll = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  // 检查下载权限
  if (!hasDownloadPermission.value) {
    ElMessage.warning('暂无下载权限，请联系管理员')
    return
  }
  
  if (!resource.value || files.value.length === 0) {
    ElMessage.warning('没有可下载的文件')
    return
  }
  
  downloadingAll.value = true
  
  try {
    // 先记录下载日志（只记录一次）
    await resourceApi.downloadResource(resource.value.id)
    if (resource.value) resource.value.downloadCount++
    
    // 依次下载所有文件
    for (let i = 0; i < files.value.length; i++) {
      const file = files.value[i]
      if (!file || !file.id) continue
      
      try {
        // 通过后端接口下载文件
        const blob = await fileApi.downloadFile(file.id)
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = file.originalName || `file-${i + 1}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        // 添加小延迟，避免浏览器阻止多个下载
        if (i < files.value.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300))
    }
      } catch (error: any) {
        console.error(`下载文件 ${file.originalName} 失败:`, error)
        ElMessage.warning(`文件 ${file.originalName} 下载失败`)
      }
    }
    
    ElMessage.success(`成功下载 ${files.value.length} 个文件`)
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || '下载失败'
    ElMessage.error(errorMessage)
    console.error('批量下载失败:', error)
  } finally {
    downloadingAll.value = false
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

onMounted(() => {
  loadResource()
})

// 监听路由参数变化，当切换不同资源时更新标题
watch(() => route.params.id, () => {
  loadResource()
})
</script>

<style scoped>
.resource-detail {
  padding: 20px 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
}

.actions {
  display: flex;
  gap: 12px;
}

.content {
  padding-top: 20px;
}

.meta {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author {
  font-weight: bold;
}

.description {
  margin-bottom: 24px;
}

.description h3,
.tags h3,
.files h3,
.markdown-content h3 {
  margin-bottom: 12px;
}

.files {
  margin-bottom: 24px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-light);
}

.tags {
  margin-bottom: 24px;
}

.markdown-content {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-light);
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin-top: 24px;
  margin-bottom: 12px;
}

.markdown-content :deep(p) {
  margin-bottom: 12px;
  line-height: 1.6;
}

.markdown-content :deep(code) {
  background-color: var(--el-bg-color);
  padding: 2px 6px;
  border-radius: 4px;
}

.markdown-content :deep(pre) {
  background-color: var(--el-bg-color);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.file-name-link {
  color: var(--el-color-primary);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s;
}

.file-name-link:hover {
  color: var(--el-color-primary-light-3);
  text-decoration: underline;
}

.file-name-link.disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}

.file-name-link.disabled:hover {
  color: var(--el-text-color-disabled);
  text-decoration: none;
}
</style>







