<template>
  <div class="forum-page">
    <el-row :gutter="20">
      <el-col :span="18">
        <div class="section-title">
          <h2>论坛</h2>
          <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange" v-if="categoryConfigs.length > 0">
            <el-tab-pane 
              v-for="config in categoryConfigs" 
              :key="`forum-tab-${config.id}-${config.code}`"
              :label="config.name" 
              :name="config.code || ''"
            ></el-tab-pane>
          </el-tabs>
          <div v-else style="padding: 20px; text-align: center; color: #999;">
            加载分类配置中...
          </div>
        </div>
        <div class="post-list" v-loading="loading">
          <el-card
            v-for="post in postList"
            :key="post.id"
            class="post-card"
            shadow="hover"
            @click="goToPost(post.id)"
          >
            <div class="post-header">
              <h3>{{ post.title }}</h3>
              <el-tag :type="getCategoryType(post.category)">{{ post.category }}</el-tag>
            </div>
            <div class="post-content">
              <p>{{ post.content.substring(0, 150) }}...</p>
            </div>
            <div class="post-footer">
              <div class="post-meta">
                <el-avatar :size="24" :src="post.authorAvatar">{{ post.authorName }}</el-avatar>
                <span class="author">{{ post.authorName }}</span>
                <span class="time">{{ formatTime(post.createTime) }}</span>
              </div>
              <div class="post-stats">
                <span><el-icon><View /></el-icon> {{ post.viewCount }}</span>
                <span><el-icon><Star /></el-icon> {{ post.likeCount }}</span>
                <span><el-icon><ChatLineRound /></el-icon> {{ post.commentCount }}</span>
              </div>
            </div>
          </el-card>
          <el-empty v-if="!loading && postList.length === 0" description="暂无帖子" />
        </div>
        <el-pagination
          v-if="total > 0"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadPosts"
        />
      </el-col>
      <el-col :span="6">
        <HotPosts @create-post="showPostDialog = true" />
      </el-col>
    </el-row>
    
    <el-dialog
      v-model="showPostDialog"
      title="发布帖子"
      width="600px"
    >
      <el-form :model="postForm" :rules="postRules" ref="postFormRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="postForm.title" placeholder="请输入帖子标题" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="postForm.category" placeholder="请选择分类">
            <el-option 
              v-for="config in categoryConfigs.filter(c => c.code !== '')" 
              :key="config.id"
              :label="config.name" 
              :value="config.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="postForm.content"
            type="textarea"
            :rows="8"
            placeholder="请输入帖子内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPostDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitPost" :loading="postLoading">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { forumApi, type ForumPost, type PostForm } from '@/api/forum'
import { categoryApi, type CategoryConfig } from '@/api/category'
import { useUserStore } from '@/stores/user'
import { View, Star, ChatLineRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import HotPosts from '@/components/HotPosts.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 页面级权限检查：如果没有page:forum权限且不允许匿名访问，重定向到登录页
onMounted(async () => {
  // 如果配置信息还未加载，先加载配置
  if (userStore.anonymousAccess === undefined) {
    await userStore.fetchSystemConfig()
  }
  
  // 如果允许匿名访问，跳过权限检查
  if (userStore.anonymousAccess) {
    return
  }
  
  // 如果不允许匿名访问，检查权限
  if (!userStore.hasPermission('page:forum')) {
    ElMessage.warning('您没有访问论坛页面的权限')
    router.push({name: 'Login'})
  }
})

const loading = ref(false)
const postList = ref<ForumPost[]>([])
const categoryConfigs = ref<CategoryConfig[]>([])
const activeCategory = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const showPostDialog = ref(false)
const postFormRef = ref<FormInstance>()
const postLoading = ref(false)
const postForm = reactive<PostForm>({
  title: '',
  category: '',
  content: ''
})

const postRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const loadCategoryConfigs = async () => {
  try {
    const configs = await categoryApi.getEnabledConfigs('FORUM')
    
    // 确保数组被正确赋值
    categoryConfigs.value = [...configs]
    
    // 设置默认选中的分类（isDefault=1的）
    const defaultConfig = configs.find(c => c.isDefault === 1)
    if (defaultConfig) {
      activeCategory.value = defaultConfig.code || ''
    } else if (configs.length > 0) {
      activeCategory.value = configs[0].code || ''
    }
    
  } catch (error) {
    ElMessage.error('加载分类配置失败')
    // 如果加载失败，使用默认配置
    categoryConfigs.value = [
      { id: 0, name: '全部', code: '', type: 'FORUM', sortOrder: 0, isDefault: 1, status: 1, createTime: '', updateTime: '' },
      { id: 1, name: '分享', code: 'SHARE', type: 'FORUM', sortOrder: 1, isDefault: 0, status: 1, createTime: '', updateTime: '' },
      { id: 2, name: '求助', code: 'HELP', type: 'FORUM', sortOrder: 2, isDefault: 0, status: 1, createTime: '', updateTime: '' },
      { id: 3, name: '教程', code: 'TUTORIAL', type: 'FORUM', sortOrder: 3, isDefault: 0, status: 1, createTime: '', updateTime: '' },
      { id: 4, name: '公告', code: 'ANNOUNCEMENT', type: 'FORUM', sortOrder: 4, isDefault: 0, status: 1, createTime: '', updateTime: '' }
    ]
    activeCategory.value = ''
  }
}

const getCategoryType = (category: string) => {
  const types: Record<string, string> = {
    SHARE: 'success',
    HELP: 'warning',
    TUTORIAL: 'info',
    ANNOUNCEMENT: 'danger'
  }
  return types[category] || ''
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

const loadPosts = async () => {
  loading.value = true
  try {
    const result = await forumApi.getPostList({
      page: page.value,
      pageSize: pageSize.value,
      category: activeCategory.value || undefined
    })
    postList.value = result.list
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载帖子失败')
  } finally {
    loading.value = false
  }
}

const handleCategoryChange = () => {
  page.value = 1
  loadPosts()
}

const goToPost = (id: number) => {
  router.push({ name: 'ForumPost', params: { id } })
}

const handleSubmitPost = async () => {
  if (!postFormRef.value) return
  
  // 检查权限
  if (!userStore.hasPermission('admin:post:create')) {
    ElMessage.error('您没有发布帖子的权限')
    return
  }
  
  await postFormRef.value.validate(async (valid) => {
    if (valid) {
      postLoading.value = true
      try {
        const post = await forumApi.createPost(postForm)
        ElMessage.success('发布成功')
        showPostDialog.value = false
        postFormRef.value.resetFields()
        loadPosts()
      } catch (error) {
        ElMessage.error('发布失败')
      } finally {
        postLoading.value = false
      }
    }
  })
}

// 组件激活时刷新数据（keep-alive 场景）
onActivated(() => {
  loadCategoryConfigs().then(() => {
    loadPosts()
  })
})

onMounted(() => {
  loadCategoryConfigs().then(() => {
    loadPosts()
  })
})
</script>

<style scoped>
.forum-page {
  padding: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.section-title {
  margin-bottom: 20px;
}

.section-title h2 {
  margin-bottom: 10px;
}

.post-list {
  margin-bottom: 20px;
}

.post-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.post-card:hover {
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.post-header h3 {
  margin: 0;
  font-size: 18px;
}

.post-content {
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-light);
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.author {
  font-weight: bold;
}

.post-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.post-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

</style>





