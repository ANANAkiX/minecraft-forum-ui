<template>
  <div class="forum-page">
    <el-row :gutter="20">
      <el-col :span="18">
        <div class="section-title">
          <h2>论坛</h2>
          <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
            <el-tab-pane label="全部" name=""></el-tab-pane>
            <el-tab-pane label="分享" name="SHARE"></el-tab-pane>
            <el-tab-pane label="求助" name="HELP"></el-tab-pane>
            <el-tab-pane label="教程" name="TUTORIAL"></el-tab-pane>
            <el-tab-pane label="公告" name="ANNOUNCEMENT"></el-tab-pane>
          </el-tabs>
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
        <el-card class="sidebar-card">
          <template #header>
            <div class="card-header">
              <h3>发帖</h3>
              <el-button
                v-if="userStore.isLoggedIn"
                type="primary"
                size="small"
                @click="showPostDialog = true"
              >
                发布帖子
              </el-button>
            </div>
          </template>
          <p v-if="!userStore.isLoggedIn" class="login-tip">
            请先<el-link type="primary" @click="$router.push('/login')">登录</el-link>后再发帖
          </p>
        </el-card>
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
            <el-option label="分享" value="SHARE" />
            <el-option label="求助" value="HELP" />
            <el-option label="教程" value="TUTORIAL" />
            <el-option label="公告" value="ANNOUNCEMENT" />
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { forumApi, type ForumPost, type PostForm } from '@/api/forum'
import { useUserStore } from '@/stores/user'
import { View, Star, ChatLineRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const postList = ref<ForumPost[]>([])
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

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.forum-page {
  padding: 20px 0;
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

.sidebar-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.login-tip {
  text-align: center;
  color: var(--el-text-color-secondary);
}
</style>

