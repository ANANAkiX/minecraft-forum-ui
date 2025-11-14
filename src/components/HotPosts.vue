<template>
  <el-card class="sidebar-card hot-posts-card">
    <template #header>
      <div class="hot-posts-header">
        <div class="header-left">
          <el-icon class="hot-icon"><Star /></el-icon>
          <h3>热门帖子</h3>
        </div>
        <el-button
          v-if="userStore.isLoggedIn && userStore.hasPermission('admin:post:create')"
          type="primary"
          @click="$emit('create-post')"
        >
          发布帖子
        </el-button>
      </div>
    </template>
    <div class="post-list" v-loading="loading">
      <div
        v-for="(post, index) in hotPosts"
        :key="post.id"
        class="post-item"
        :class="{ 'top-post': index < 3 }"
        @click="goToPost(post.id)"
      >
        <div class="post-rank">
          <span class="rank-number" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
        </div>
        <div class="post-content-wrapper">
          <h4 class="post-title">{{ post.title }}</h4>
          <div class="post-meta">
            <span class="author">
              <el-icon><User /></el-icon>
              {{ post.authorName }}
            </span>
            <span class="views">
              <el-icon><View /></el-icon>
              {{ post.viewCount }}
            </span>
          </div>
        </div>
      </div>
      <div v-if="!loading && hotPosts.length === 0" class="empty-posts">
        <el-empty description="暂无热门帖子" :image-size="80" />
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Star, User, View } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useHotPostsStore } from '@/stores/hotPosts'

const emit = defineEmits<{
  'create-post': []
}>()

const router = useRouter()
const userStore = useUserStore()
const hotPostsStore = useHotPostsStore()

// 使用 store 中的数据
const hotPosts = computed(() => hotPostsStore.hotPosts)
const loading = computed(() => hotPostsStore.loading)

const goToPost = (id: number) => {
  router.push({ name: 'ForumPost', params: { id } })
}

onMounted(() => {
  // 只在首次加载时获取数据，store 内部会判断是否已加载
  hotPostsStore.loadHotPosts()
})

defineExpose({
  loadHotPosts: hotPostsStore.loadHotPosts
})
</script>

<style scoped>
.sidebar-card {
  margin-bottom: 20px;
  margin-top: 100px;
}

.hot-posts-card {
  position: relative;
  overflow: hidden;
}

.hot-posts-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #67c23a 0%, #85ce61 50%, #95d475 100%);
}

.hot-posts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hot-posts-header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
}

.hot-icon {
  color: #f56c6c;
  font-size: 20px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.post-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  position: relative;
}

.post-item:hover {
  background-color: var(--el-bg-color-page);
  border-left-color: var(--el-color-primary);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.post-item:last-child {
  border-bottom: none;
}

.post-item.top-post {
  background: linear-gradient(90deg, rgba(103, 194, 58, 0.05) 0%, transparent 100%);
}

.post-item.top-post:hover {
  background: linear-gradient(90deg, rgba(103, 194, 58, 0.1) 0%, var(--el-bg-color-page) 100%);
}

.post-rank {
  flex-shrink: 0;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background-color: var(--el-bg-color);
  border: 2px solid var(--el-border-color-light);
  transition: all 0.3s ease;
}

.post-item:hover .rank-number {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #fff;
  border-color: #ffd700;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
}

.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
  color: #fff;
  border-color: #c0c0c0;
  box-shadow: 0 2px 4px rgba(192, 192, 192, 0.3);
}

.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #e6a85c 100%);
  color: #fff;
  border-color: #cd7f32;
  box-shadow: 0 2px 4px rgba(205, 127, 50, 0.3);
}

.post-content-wrapper {
  flex: 1;
  min-width: 0;
}

.post-title {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color 0.3s ease;
}

.post-item:hover .post-title {
  color: var(--el-color-primary);
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.post-meta .author,
.post-meta .views {
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-meta .el-icon {
  font-size: 14px;
}

.empty-posts {
  padding: 20px 0;
}
</style>

