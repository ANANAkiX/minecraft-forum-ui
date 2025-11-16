<template>
  <div class="forum-post">
    <el-row :gutter="20">
      <el-col :span="18" v-loading="loading">
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
              :icon="isLiked ? GoodsFilled : Goods"
              circle
              @click="handleLike"
            >
            </el-button>
            <span class="like-count">{{ post.likeCount }}</span>
          </div>
        </div>
      </template>
      <div class="post-content" v-html="formatContent(post.content)"></div>
      
      <div class="comments-section">
        <h3>评论 ({{ commentTotal }})</h3>
        <div class="comment-form" v-if="userStore.isLoggedIn">
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
          />
          <el-button type="primary" @click="handleSubmitComment" style="margin-top: 12px" :loading="submitting">
            发表评论
          </el-button>
        </div>
        
        <!-- 无限滚动评论列表 -->
        <div 
          ref="scrollContainer"
          class="comment-list-container" 
          v-infinite-scroll="loadMoreComments"
          :infinite-scroll-disabled="commentLoading || noMoreComments || !initialLoadComplete"
          :infinite-scroll-distance="100"
          :infinite-scroll-immediate="false"
        >
        <div class="comment-list">
          <div
              v-for="comment in comments"
            :key="comment.id"
              :id="`comment-${comment.id}`"
            class="comment-item"
          >
            <el-avatar :src="comment.authorAvatar">{{ comment.authorName }}</el-avatar>
            <div class="comment-content">
              <div class="comment-header">
                <span class="author">{{ comment.authorName }}</span>
                <span class="time">{{ formatTime(comment.createTime) }}</span>
                <el-button
                  v-if="userStore.userInfo?.id === comment.authorId"
                  link
                  type="danger"
                  size="small"
                  @click="handleDeleteComment(comment.id)"
                >
                  删除
                </el-button>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-divider"></div>
              <div class="comment-actions">
                <el-button
                  link
                  type="primary"
                  @click="showReplyInput(comment.id, null, comment.authorId, comment.authorName)"
                >
                  回复
                </el-button>
                <el-button
                  link
                  :type="comment.isLiked ? 'danger' : 'default'"
                  :icon="comment.isLiked ? GoodsFilled : Goods"
                  @click="handleToggleLikeComment(comment.id)"
                >
                </el-button>
                <span class="like-count">{{ comment.likeCount }}</span>
              </div>
              
              <!-- 回复输入框（回复根评论时显示） -->
              <div v-if="replyInputVisible && replyInputCommentId === comment.id && replyInputReplyId === null" class="reply-input">
                <el-input
                  :ref="(el: any) => { if (el) rootCommentInputRef = el }"
                  v-model="replyContent"
                  type="textarea"
                  :rows="2"
                  :placeholder="`回复 ${replyInputTargetName}...`"
                />
                <div class="reply-actions">
                  <el-button size="small" @click="cancelReply">取消</el-button>
                  <el-button size="small" type="primary" @click="handleSubmitReply(comment.id)" :loading="submitting">
                    提交
                  </el-button>
                </div>
              </div>
              
              <!-- 展开/折叠回复按钮 -->
              <div v-if="comment.replyCount && comment.replyCount > 0" class="expand-replies">
                <el-button
                  v-if="!expandedComments.has(comment.id)"
                  link
                  type="primary"
                  size="small"
                  :loading="loadingReplies.has(comment.id)"
                  @click="expandReplies(comment.id)"
                >
                  展开 {{ comment.replyCount }} 条回复
                </el-button>
                <el-button
                  v-else
                  link
                  type="primary"
                  size="small"
                  @click="collapseReplies(comment.id)"
                >
                  收起回复
                </el-button>
              </div>
              
              <!-- 回复树形结构（只在展开时显示） -->
              <div class="reply-tree" v-if="expandedComments.has(comment.id) && comment.replies && comment.replies.length > 0">
                <ReplyItem
                  v-for="reply in comment.replies"
                  :key="reply.id"
                  :reply="reply"
                  :comment-id="comment.id"
                  :show-reply-input="replyInputVisible && replyInputCommentId === comment.id && replyInputReplyId === reply.id"
                  :reply-content="replyContent"
                  :reply-target-name="replyInputTargetName"
                  :submitting="submitting"
                  @reply="handleReplyToReply"
                  @like="handleToggleLikeReply"
                  @delete="handleDeleteReply"
                  @submit-reply="handleSubmitReply"
                  @cancel-reply="cancelReply"
                  @update-reply-content="(content: string) => replyContent = content"
                />
                  </div>
                </div>
              </div>
            
            <div v-if="commentLoading" class="loading-more">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载中...</span>
            </div>
            <div v-if="noMoreComments && comments.length > 0" class="no-more">
              没有更多评论了
            </div>
            <el-empty v-if="!commentLoading && comments.length === 0" description="暂无评论" />
          </div>
        </div>
      </div>
    </el-card>
      </el-col>
      <el-col :span="6">
        <HotPosts />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { forumApi, type ForumPost, type Comment, type Reply } from '@/api/forum'
import { useUserStore } from '@/stores/user'
import { usePageTitle } from '@/composables/usePageTitle'
import { Goods, GoodsFilled, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// @ts-ignore
import MarkdownIt from 'markdown-it'
import ReplyItem from '@/components/ReplyItem.vue'
import HotPosts from '@/components/HotPosts.vue'

const route = useRoute()
const userStore = useUserStore()
const pageTitle = usePageTitle()

const loading = ref(false)
const post = ref<ForumPost | null>(null)
const isLiked = ref(false)
const commentContent = ref('')
const submitting = ref(false)

// 评论相关
const comments = ref<Comment[]>([])
const commentPage = ref(1)
const commentPageSize = ref(5) // 初始只加载5条根评论
const commentTotal = ref(0)
const commentLoading = ref(false)
const noMoreComments = ref(false)
const initialLoadComplete = ref(false) // 初始加载是否完成
const expandedComments = ref<Set<number>>(new Set()) // 已展开的评论ID集合
const loadingReplies = ref<Set<number>>(new Set()) // 正在加载子评论的评论ID集合
const scrollContainer = ref<HTMLElement | null>(null) // 滚动容器引用

// 回复相关
const replyInputVisible = ref(false)
const replyInputCommentId = ref<number | null>(null)
const replyInputReplyId = ref<number | null>(null) // 当前正在回复的回复ID（如果是回复根评论则为null）
const replyInputParentId = ref<number | null>(null)
const replyInputTargetUserId = ref<number | null>(null)
const replyInputTargetName = ref('')
const replyContent = ref('')
const rootCommentInputRef = ref<any>(null)

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
  // 重置评论相关状态，确保初始只加载5条
  commentPage.value = 1
  comments.value = []
  noMoreComments.value = false
  initialLoadComplete.value = false // 重置初始加载完成标志
  expandedComments.value.clear()
  
  try {
    post.value = await forumApi.getPostById(id)
    // 设置页面标题，保存ID用于跳转
    if (post.value) {
      pageTitle.setPostTitle(post.value.title, post.value.id)
      // 从后端数据中获取点赞状态
      isLiked.value = post.value.isLiked ?? false
      commentTotal.value = post.value.commentCount || 0
    }
    
    // 检查是否有评论ID参数（从个人中心跳转过来）
    const commentId = route.query.commentId as string
    if (commentId) {
      await loadComments()
      await nextTick()
      initialLoadComplete.value = true // 初始加载完成
      // 滚动到指定评论
      const commentElement = document.getElementById(`comment-${commentId}`)
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        commentElement.classList.add('highlight')
        setTimeout(() => {
          commentElement.classList.remove('highlight')
        }, 2000)
      }
    } else {
      // 正常加载评论（初始只加载5条）
      await loadComments()
      await nextTick()
      initialLoadComplete.value = true // 初始加载完成，允许无限滚动
    }
  } catch (error) {
    ElMessage.error('加载帖子失败')
  } finally {
    loading.value = false
  }
}

const loadComments = async () => {
  if (!post.value || commentLoading.value) return
  
  commentLoading.value = true
  try {
    const result = await forumApi.getCommentsByPostId(post.value.id, commentPage.value, commentPageSize.value)
    if (commentPage.value === 1) {
      comments.value = result.list
    } else {
      comments.value.push(...result.list)
    }
    commentTotal.value = result.total
    noMoreComments.value = comments.value.length >= result.total
  } catch (error) {
    ElMessage.error('加载评论失败')
  } finally {
    commentLoading.value = false
  }
}

const loadMoreComments = async () => {
  // 防止在初始加载时触发
  if (!initialLoadComplete.value) return
  if (noMoreComments.value) return
  if (commentLoading.value) return
  if (comments.value.length === 0) return
  
  commentPage.value++
  await loadComments()
}

// 展开评论的子回复
const expandReplies = async (commentId: number) => {
  if (loadingReplies.value.has(commentId)) return
  
  loadingReplies.value.add(commentId)
  try {
    const replies = await forumApi.getRepliesByCommentId(commentId)
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      comment.replies = replies
      expandedComments.value.add(commentId)
    }
  } catch (error) {
    ElMessage.error('加载回复失败')
  } finally {
    loadingReplies.value.delete(commentId)
  }
}

// 折叠评论的子回复
const collapseReplies = (commentId: number) => {
  expandedComments.value.delete(commentId)
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
  
  submitting.value = true
  try {
    await forumApi.createComment(post.value.id, commentContent.value)
    ElMessage.success('评论成功')
    commentContent.value = ''
    // 重新加载评论
    commentPage.value = 1
    comments.value = []
    await loadComments()
    // 更新评论总数
    if (post.value) {
      post.value.commentCount = (post.value.commentCount || 0) + 1
      commentTotal.value = post.value.commentCount
    }
  } catch (error) {
    ElMessage.error('评论失败')
  } finally {
    submitting.value = false
  }
}

const showReplyInput = async (commentId: number, replyId: number | null, targetUserId: number, targetName: string) => {
  replyInputVisible.value = true
  replyInputCommentId.value = commentId
  replyInputReplyId.value = replyId // 记录正在回复的回复ID
  replyInputParentId.value = null // 所有回复都是根评论的直接子回复
  replyInputTargetUserId.value = targetUserId
  replyInputTargetName.value = targetName
  replyContent.value = ''
  
  // 等待 DOM 更新后聚焦输入框
  await nextTick()
  // 使用 setTimeout 确保 DOM 完全渲染
  setTimeout(() => {
    if (replyId === null) {
      // 聚焦根评论的输入框
      // 通过 commentId 查找对应的输入框
      const commentElement = document.querySelector(`#comment-${commentId}`)
      if (commentElement) {
        const textarea = commentElement.querySelector('.reply-input textarea') as HTMLTextAreaElement
        if (textarea) {
          textarea.focus()
        }
      }
    }
  }, 150)
}

const cancelReply = () => {
  replyInputVisible.value = false
  replyInputCommentId.value = null
  replyInputReplyId.value = null
  replyInputParentId.value = null
  replyInputTargetUserId.value = null
  replyInputTargetName.value = ''
  replyContent.value = ''
}

const handleSubmitReply = async (commentId: number) => {
  if (!replyContent.value.trim()) return
  
  submitting.value = true
  try {
    await forumApi.createReply(
      commentId,
      replyContent.value,
      replyInputTargetUserId.value || undefined,
      replyInputParentId.value || undefined
    )
    ElMessage.success('回复成功')
    cancelReply()
    
    // 更新评论的回复数量
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      comment.replyCount = (comment.replyCount || 0) + 1
      // 如果评论已展开，重新加载子评论
      if (expandedComments.value.has(commentId)) {
        await expandReplies(commentId)
      }
    }
    
    // 更新帖子评论总数
    if (post.value) {
      post.value.commentCount = (post.value.commentCount || 0) + 1
      commentTotal.value = post.value.commentCount
    }
  } catch (error) {
    ElMessage.error('回复失败')
  } finally {
    submitting.value = false
  }
}

const handleReplyToReply = (reply: Reply, commentId: number) => {
  // 回复子回复时，replyId 设置为被回复的回复ID，所有回复都是根评论的直接子回复
  showReplyInput(commentId, reply.id, reply.authorId, reply.authorName)
}

const handleToggleLikeComment = async (commentId: number) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  // 查找当前评论的点赞状态
  const comment = comments.value.find(c => c.id === commentId)
  if (!comment) return
  
  const isLiked = comment.isLiked || false
  
  try {
    if (isLiked) {
      await forumApi.unlikeComment(commentId)
      // 直接更新状态，不重新加载评论
      comment.isLiked = false
      comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1)
    } else {
      await forumApi.likeComment(commentId)
      // 直接更新状态，不重新加载评论
      comment.isLiked = true
      comment.likeCount = (comment.likeCount || 0) + 1
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleToggleLikeReply = async (replyId: number) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    const reply = findReplyById(replyId)
    if (!reply) return
    
    const isLiked = reply.isLiked || false
    
    if (isLiked) {
      await forumApi.unlikeReply(replyId)
      // 直接更新状态，不重新加载评论
      reply.isLiked = false
      reply.likeCount = Math.max(0, (reply.likeCount || 0) - 1)
    } else {
      await forumApi.likeReply(replyId)
      // 直接更新状态，不重新加载评论
      reply.isLiked = true
      reply.likeCount = (reply.likeCount || 0) + 1
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDeleteComment = async (commentId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？删除后该评论的所有回复也会被删除。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await forumApi.deleteComment(commentId)
    ElMessage.success('删除成功')
    // 重新加载评论
    commentPage.value = 1
    comments.value = []
    await loadComments()
    // 更新评论总数
    if (post.value) {
      post.value.commentCount = Math.max(0, (post.value.commentCount || 0) - 1)
      commentTotal.value = post.value.commentCount
    }
  } catch (error: any) {
    // 用户取消删除时不显示错误
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleDeleteReply = async (replyId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条回复吗？删除后该回复的所有子回复也会被删除。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 找到回复所属的评论
    let targetComment: Comment | undefined
    for (const comment of comments.value) {
      if (comment.replies) {
        const reply = comment.replies.find(r => r.id === replyId)
        if (reply) {
          targetComment = comment
          break
        }
      }
    }
    
    await forumApi.deleteReply(replyId)
    ElMessage.success('删除成功')
    
    // 更新评论的回复数量和列表
    if (targetComment) {
      // 从回复列表中删除
      if (targetComment.replies) {
        targetComment.replies = targetComment.replies.filter(r => r.id !== replyId)
      }
      // 更新回复数量
      targetComment.replyCount = Math.max(0, (targetComment.replyCount || 0) - 1)
      
      // 如果评论已展开，重新加载子评论以获取最新数据
      if (expandedComments.value.has(targetComment.id)) {
        await expandReplies(targetComment.id)
      }
    }
    
    // 更新帖子评论总数
    if (post.value) {
      post.value.commentCount = Math.max(0, (post.value.commentCount || 0) - 1)
      commentTotal.value = post.value.commentCount
    }
  } catch (error: any) {
    // 用户取消删除时不显示错误
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const findReplyById = (replyId: number): Reply | null => {
  for (const comment of comments.value) {
    if (comment.replies) {
      const reply = findReplyInTree(comment.replies, replyId)
      if (reply) return reply
    }
  }
  return null
}

const findReplyInTree = (replies: Reply[], replyId: number): Reply | null => {
  for (const reply of replies) {
    if (reply.id === replyId) return reply
    if (reply.children) {
      const found = findReplyInTree(reply.children, replyId)
      if (found) return found
    }
  }
  return null
}

onMounted(() => {
  loadPost()
})

// 监听路由参数变化，当切换不同帖子时更新标题
watch(() => route.params.id, () => {
  commentPage.value = 1
  comments.value = []
  noMoreComments.value = false
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
  align-items: center;
  gap: 8px;
}

.like-count {
  color: var(--el-text-color-secondary);
  font-size: 14px;
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

.comment-list-container {
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: 20px;
  padding-right: 10px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 200px;
}

.comment-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  transition: background-color 0.3s;
  align-items: flex-start;
  position: relative;
}

.comment-item .el-avatar {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  align-self: flex-start;
}

.comment-item.highlight {
  background-color: var(--el-color-primary-light-9);
  animation: highlight 2s;
}

@keyframes highlight {
  0%, 100% {
    background-color: var(--el-color-primary-light-9);
  }
  50% {
    background-color: var(--el-color-primary-light-8);
  }
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
  margin-bottom: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-divider {
  height: 1px;
  background-color: var(--el-border-color-lighter);
  margin: 8px 0;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-actions .like-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.expand-replies {
  margin-top: 8px;
  margin-bottom: 8px;
}

.reply-input {
  margin-top: 12px;
  padding: 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.reply-tree {
  margin-top: 16px;
  padding-left: 16px;
  border-left: 2px solid var(--el-border-color-light);
}

.loading-more,
.no-more {
  text-align: center;
  padding: 20px;
  color: var(--el-text-color-secondary);
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>


