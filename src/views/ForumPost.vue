<template>
  <div class="forum-post" v-loading="loading">
    <el-card v-if="post">
      <template #header>
        <div class="post-header">
          <div>
            <h1>{{ post.title }}</h1>
            <div class="post-meta">
              <el-avatar :src="post.authorAvatar">{{ post.authorName }}</el-avatar>
              <span class="author">{{ post.authorName }}</span>
              <span class="time">{{ formatTime(post.createTime) }}</span>
              <el-tag :type="getCategoryType(post.category)">{{ post.category }}</el-tag>
            </div>
          </div>
          <div class="post-actions">
            <el-button
              :type="isLiked ? 'danger' : 'default'"
              :icon="Star"
              @click="handleLike"
            >
              {{ isLiked ? '已点赞' : '点赞' }} {{ post.likeCount }}
            </el-button>
          </div>
        </div>
      </template>
      <div class="post-content" v-html="formatContent(post.content)"></div>
      
      <div class="comments-section">
        <h3>评论 ({{ post.commentCount }})</h3>
        <div class="comment-form" v-if="userStore.isLoggedIn">
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
          />
          <el-button type="primary" @click="handleSubmitComment" style="margin-top: 12px">
            发表评论
          </el-button>
        </div>
        <div class="comment-list">
          <div
            v-for="comment in post.comments"
            :key="comment.id"
            class="comment-item"
          >
            <el-avatar :src="comment.authorAvatar">{{ comment.authorName }}</el-avatar>
            <div class="comment-content">
              <div class="comment-header">
                <span class="author">{{ comment.authorName }}</span>
                <span class="time">{{ formatTime(comment.createTime) }}</span>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-actions">
                <el-button
                  link
                  type="primary"
                  @click="showReplyDialog(comment.id, comment.authorId, comment.authorName)"
                >
                  回复
                </el-button>
                <el-button
                  link
                  :type="comment.isLiked ? 'danger' : 'default'"
                  @click="handleLikeComment(comment.id)"
                >
                  点赞 {{ comment.likeCount }}
                </el-button>
              </div>
              <div class="reply-list" v-if="comment.replies && comment.replies.length">
                <div
                  v-for="reply in comment.replies"
                  :key="reply.id"
                  class="reply-item"
                >
                  <el-avatar :size="32" :src="reply.authorAvatar">{{ reply.authorName }}</el-avatar>
                  <div class="reply-content">
                    <span class="author">{{ reply.authorName }}</span>
                    <span v-if="reply.targetUserName" class="reply-to">
                      回复 @{{ reply.targetUserName }}
                    </span>
                    <span class="text">{{ reply.content }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <el-dialog
      v-model="showReplyDialogVisible"
      title="回复评论"
      width="500px"
    >
      <el-input
        v-model="replyContent"
        type="textarea"
        :rows="4"
        placeholder="写下你的回复..."
      />
      <template #footer>
        <el-button @click="showReplyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitReply">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { forumApi, type ForumPost } from '@/api/forum'
import { useUserStore } from '@/stores/user'
import { usePageTitle } from '@/composables/usePageTitle'
import { Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const userStore = useUserStore()
const pageTitle = usePageTitle()

const loading = ref(false)
const post = ref<ForumPost | null>(null)
const isLiked = ref(false)
const commentContent = ref('')
const showReplyDialogVisible = ref(false)
const replyContent = ref('')
const currentCommentId = ref<number | null>(null)
const targetUserId = ref<number | null>(null)
const targetUserName = ref('')

const md = new MarkdownIt()

const formatContent = (content: string) => {
  return md.render(content)
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
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

const loadPost = async () => {
  const id = parseInt(route.params.id as string)
  if (!id) return
  
  loading.value = true
  try {
    post.value = await forumApi.getPostById(id)
    // 设置页面标题，保存ID用于跳转
    if (post.value) {
      pageTitle.setPostTitle(post.value.title, post.value.id)
      // 从后端数据中获取点赞状态
      isLiked.value = post.value.isLiked ?? false
    }
  } catch (error) {
    ElMessage.error('加载帖子失败')
  } finally {
    loading.value = false
  }
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (!post.value) return
  
  try {
    if (isLiked.value) {
      await forumApi.unlikePost(post.value.id)
      isLiked.value = false
      if (post.value) post.value.likeCount--
    } else {
      await forumApi.likePost(post.value.id)
      isLiked.value = true
      if (post.value) post.value.likeCount++
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleSubmitComment = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (!post.value || !commentContent.value.trim()) return
  
  try {
    await forumApi.createComment(post.value.id, commentContent.value)
    ElMessage.success('评论成功')
    commentContent.value = ''
    loadPost()
  } catch (error) {
    ElMessage.error('评论失败')
  }
}

const showReplyDialog = (commentId: number, userId: number, userName: string) => {
  currentCommentId.value = commentId
  targetUserId.value = userId
  targetUserName.value = userName
  showReplyDialogVisible.value = true
}

const handleSubmitReply = async () => {
  if (!currentCommentId.value || !replyContent.value.trim()) return
  
  try {
    await forumApi.createReply(currentCommentId.value, replyContent.value, targetUserId.value || undefined)
    ElMessage.success('回复成功')
    replyContent.value = ''
    showReplyDialogVisible.value = false
    loadPost()
  } catch (error) {
    ElMessage.error('回复失败')
  }
}

const handleLikeComment = async (commentId: number) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    await forumApi.likeComment(commentId)
    loadPost()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadPost()
})

// 监听路由参数变化，当切换不同帖子时更新标题
watch(() => route.params.id, () => {
  loadPost()
})
</script>

<style scoped>
.forum-post {
  padding: 20px 0;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.post-header h1 {
  margin: 0 0 12px 0;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-secondary);
}

.author {
  font-weight: bold;
}

.post-actions {
  display: flex;
  gap: 12px;
}

.post-content {
  padding: 20px 0;
  line-height: 1.6;
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 24px;
}

.comments-section h3 {
  margin-bottom: 20px;
}

.comment-form {
  margin-bottom: 24px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-text {
  margin-bottom: 8px;
  line-height: 1.6;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.reply-list {
  margin-top: 16px;
  padding-left: 16px;
  border-left: 2px solid var(--el-border-color-light);
}

.reply-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.reply-content {
  flex: 1;
}

.reply-content .author {
  font-weight: bold;
  margin-right: 8px;
}

.reply-to {
  color: var(--el-color-primary);
  margin-right: 8px;
}

.reply-content .text {
  color: var(--el-text-color-secondary);
}
</style>







