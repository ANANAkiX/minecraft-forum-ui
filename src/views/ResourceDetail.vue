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
            <el-button type="primary" :icon="Download" @click="handleDownload">
              下载 {{ resource.downloadCount }}
            </el-button>
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
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { resourceApi, type Resource } from '@/api/resource'
import { useUserStore } from '@/stores/user'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const resource = ref<Resource | null>(null)
const isLiked = ref(false)
const isFavorited = ref(false)

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

const handleDownload = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (!resource.value) return
  
  try {
    await resourceApi.downloadResource(resource.value.id)
    if (resource.value) resource.value.downloadCount++
    ElMessage.success('下载成功')
    // 实际下载文件
    if (resource.value.fileUrl) {
      window.open(resource.value.fileUrl, '_blank')
    }
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

onMounted(() => {
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
.markdown-content h3 {
  margin-bottom: 12px;
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
</style>

