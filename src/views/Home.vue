<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="18">
        <div class="section-title">
          <h2>热门资源</h2>
          <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange" v-if="categoryConfigs.length > 0">
            <el-tab-pane 
              v-for="config in categoryConfigs" 
              :key="config.id"
              :label="config.name" 
              :name="config.code || ''"
            ></el-tab-pane>
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
        <el-card class="sidebar-card hot-posts-card">
          <template #header>
            <div class="hot-posts-header">
              <el-icon class="hot-icon"><Star /></el-icon>
              <h3>热门帖子</h3>
            </div>
          </template>
          <div class="post-list">
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
            <div v-if="hotPosts.length === 0" class="empty-posts">
              <el-empty description="暂无热门帖子" :image-size="80" />
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
import {categoryApi, type CategoryConfig} from '@/api/category'
import {User, Download, Star, Clock, View} from '@element-plus/icons-vue'
import {ElMessage} from 'element-plus'
import {isLoggedIn, toLogin} from "@/utils/auth.ts";
import {useUserStore} from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 页面级权限检查：如果没有page:home权限且不允许匿名访问，重定向到登录页
onMounted(async () => {
  // 如果配置信息还未加载，先加载配置
  if (userStore.anonymousAccess === undefined) {
    await userStore.fetchSystemConfig()
  }
  
  // 如果允许匿名访问，跳过权限检查
  if (userStore.anonymousAccess) {
    // 加载分类配置和资源列表
    await loadCategoryConfigs()
    await loadResources()
    await loadHotPosts()
    return
  }
  
  // 如果不允许匿名访问，检查权限
  if (!userStore.hasPermission('page:home')) {
    ElMessage.warning('您没有访问首页的权限')
    router.push({name: 'Login'})
    return
  }
  
  // 加载分类配置和资源列表
  await loadCategoryConfigs()
  await loadResources()
  await loadHotPosts()
})

const loading = ref(false)
const resourceList = ref<Resource[]>([])
const hotPosts = ref<ForumPost[]>([])
const categoryConfigs = ref<CategoryConfig[]>([])
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

const loadCategoryConfigs = async () => {
  try {
    const configs = await categoryApi.getEnabledConfigs('RESOURCE')
    
    // 如果允许匿名访问，显示所有分类，不进行权限过滤
    let filteredConfigs = configs
    if (!userStore.anonymousAccess) {
      // 根据权限过滤分类标签页
      filteredConfigs = configs.filter(config => {
        const code = config.code || ''
        // 映射分类代码到权限
        const permissionMap: Record<string, string> = {
          '': 'page:home:all',
          'PACK': 'page:home:pack',
          'MOD': 'page:home:mod',
          'RESOURCE': 'page:home:resource'
        }
        const requiredPermission = permissionMap[code]
        // 如果有对应的权限要求，检查权限；否则允许显示
        if (requiredPermission) {
          return userStore.hasPermission(requiredPermission)
        }
        return true
      })
    }
    
    categoryConfigs.value = filteredConfigs
    
    // 设置默认选中的分类（isDefault=1的，且用户有权限的）
    const defaultConfig = filteredConfigs.find(c => c.isDefault === 1)
    if (defaultConfig) {
      activeCategory.value = defaultConfig.code || ''
    } else if (filteredConfigs.length > 0) {
      activeCategory.value = filteredConfigs[0].code || ''
    } else {
      // 如果所有分类都没有权限，设置为空（显示全部，但可能没有权限）
      activeCategory.value = ''
    }
  } catch (error) {
    ElMessage.error('加载分类配置失败')
    // 如果加载失败，根据权限使用默认配置
    const defaultConfigs = [
      { id: 0, name: '全部', code: '', type: 'RESOURCE', sortOrder: 0, isDefault: 1, status: 1, createTime: '', updateTime: '' },
      { id: 1, name: '整合包', code: 'PACK', type: 'RESOURCE', sortOrder: 1, isDefault: 0, status: 1, createTime: '', updateTime: '' },
      { id: 2, name: 'MOD', code: 'MOD', type: 'RESOURCE', sortOrder: 2, isDefault: 0, status: 1, createTime: '', updateTime: '' },
      { id: 3, name: '资源包', code: 'RESOURCE', type: 'RESOURCE', sortOrder: 3, isDefault: 0, status: 1, createTime: '', updateTime: '' }
    ]
    
    // 如果允许匿名访问，显示所有默认分类，不进行权限过滤
    if (userStore.anonymousAccess) {
      categoryConfigs.value = defaultConfigs
    } else {
      // 根据权限过滤
      const permissionMap: Record<string, string> = {
        '': 'page:home:all',
        'PACK': 'page:home:pack',
        'MOD': 'page:home:mod',
        'RESOURCE': 'page:home:resource'
      }
      
      categoryConfigs.value = defaultConfigs.filter(config => {
        const code = config.code || ''
        const requiredPermission = permissionMap[code]
        if (requiredPermission) {
          return userStore.hasPermission(requiredPermission)
        }
        return true
      })
    }
    
    if (categoryConfigs.value.length > 0) {
      activeCategory.value = categoryConfigs.value[0].code || ''
    } else {
      activeCategory.value = ''
    }
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
  loadCategoryConfigs().then(() => {
  loadResources()
  })
  loadHotPosts()
})

onMounted(() => {
  loadCategoryConfigs().then(() => {
  loadResources()
  })
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

