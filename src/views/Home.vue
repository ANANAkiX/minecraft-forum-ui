<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="18">
        <div class="section-title">
          <h2>热门资源</h2>
          <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
            <el-tab-pane label="全部" name=""></el-tab-pane>
            <el-tab-pane label="整合包" name="PACK"></el-tab-pane>
            <el-tab-pane label="MOD" name="MOD"></el-tab-pane>
            <el-tab-pane label="资源包" name="RESOURCE"></el-tab-pane>
          </el-tabs>
        </div>
        <div class="resource-list" v-loading="loading">
          <el-card
              v-for="resource in resourceList"
              :key="resource.id"
              class="resource-card"
              shadow="hover"
              @click="goToDetail(resource.id)"
          >
            <template #header>
              <div class="card-header">
                <span class="title">{{ resource.title }}</span>
                <el-tag type="success" size="small">{{ resource.category }}</el-tag>
              </div>
            </template>
            <div class="card-content">
              <p class="description">{{ resource.description }}</p>
              <div class="card-meta">
                <div class="meta-item">
                  <el-icon>
                    <User/>
                  </el-icon>
                  <span>{{ resource.authorName }}</span>
                </div>
                <div class="meta-item">
                  <el-icon>
                    <Download/>
                  </el-icon>
                  <span>{{ resource.downloadCount }}</span>
                </div>
                <div class="meta-item">
                  <el-icon>
                    <Star/>
                  </el-icon>
                  <span>{{ resource.likeCount }}</span>
                </div>
                <div class="meta-item">
                  <el-icon>
                    <Clock/>
                  </el-icon>
                  <span>{{ formatTime(resource.createTime) }}</span>
                </div>
              </div>
              <div class="tags" v-if="resource.tags.length">
                <el-tag
                    v-for="tag in resource.tags"
                    :key="tag"
                    size="small"
                    effect="plain"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </el-card>
          <el-empty v-if="!loading && resourceList.length === 0" description="暂无资源"/>
        </div>
        <el-pagination
            v-if="total > 0"
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="loadResources"
        />
      </el-col>
      <el-col :span="6">
        <el-card class="sidebar-card">
          <template #header>
            <h3>热门帖子</h3>
          </template>
          <div class="post-list">
            <div
                v-for="post in hotPosts"
                :key="post.id"
                class="post-item"
                @click="goToPost(post.id)"
            >
              <h4>{{ post.title }}</h4>
              <div class="post-meta">
                <span>{{ post.authorName }}</span>
                <span>{{ post.viewCount }} 浏览</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, onActivated, watch} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {resourceApi, type Resource} from '@/api/resource'
import {forumApi, type ForumPost} from '@/api/forum'
import {User, Download, Star, Clock} from '@element-plus/icons-vue'
import {ElMessage} from 'element-plus'
import {isLoggedIn, toLogin} from "@/utils/auth.ts";

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const resourceList = ref<Resource[]>([])
const hotPosts = ref<ForumPost[]>([])
const activeCategory = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const loadResources = async () => {
  loading.value = true
  try {
    const keyword = route.query.keyword as string
    const result = await resourceApi.getResourceList({
      page: page.value,
      pageSize: pageSize.value,
      category: activeCategory.value || undefined,
      keyword: keyword || undefined
    })
    resourceList.value = result.list
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载资源失败')
  } finally {
    loading.value = false
  }
}

const loadHotPosts = async () => {
  try {
    const result = await forumApi.getPostList({page: 1, pageSize: 5})
    hotPosts.value = result.list
  } catch (error) {
    // 静默失败
  }
}

const handleCategoryChange = () => {
  page.value = 1
  loadResources()
}

const goToDetail = (id: number) => {
  if (!isLoggedIn()) {
    router.push("/login")
    return
  } else {
    router.push({name: 'ResourceDetail', params: {id}})
  }

}

const goToPost = (id: number) => {
  router.push({name: 'ForumPost', params: {id}})
}

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

watch(() => route.query.keyword, () => {
  loadResources()
})

// 监听路由名称变化，当返回首页时刷新数据
watch(() => route.name, (newName) => {
  if (newName === 'Home') {
    loadResources()
    loadHotPosts()
  }
})

// 组件激活时刷新数据（keep-alive 场景）
onActivated(() => {
  loadResources()
  loadHotPosts()
})

onMounted(() => {
  loadResources()
  loadHotPosts()
})
</script>

<style scoped>
.home {
  padding: 20px 0;
}

.section-title {
  margin-bottom: 20px;
}

.section-title h2 {
  margin-bottom: 10px;
}

.resource-list {
  margin-bottom: 20px;
}

.resource-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.resource-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 18px;
  font-weight: bold;
}

.card-content {
  padding-top: 12px;
}

.description {
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sidebar-card {
  margin-bottom: 20px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  cursor: pointer;
  transition: background-color 0.2s;
}

.post-item:hover {
  background-color: var(--el-bg-color);
}

.post-item h4 {
  font-size: 14px;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

