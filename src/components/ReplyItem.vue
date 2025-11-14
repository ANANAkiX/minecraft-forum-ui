<template>
  <div class="reply-item">
    <el-avatar :size="32" :src="reply.authorAvatar">{{ reply.authorName }}</el-avatar>
    <div class="reply-content">
      <div class="reply-header">
        <span class="author">{{ reply.authorName }}</span>
        <span v-if="reply.targetUserName" class="reply-to">
          回复 @{{ reply.targetUserName }}
        </span>
        <span class="time">{{ formatTime(reply.createTime) }}</span>
        <el-button
          v-if="userStore.userInfo?.id === reply.authorId"
          link
          type="danger"
          size="small"
          @click="$emit('delete', reply.id)"
        >
          删除
        </el-button>
      </div>
      <div class="reply-text">{{ reply.content }}</div>
      <div class="reply-actions">
        <el-button
          link
          type="primary"
          size="small"
          @click="$emit('reply', reply, commentId)"
        >
          回复
        </el-button>
        <el-button
          link
          :type="reply.isLiked ? 'danger' : 'default'"
          :icon="reply.isLiked ? GoodsFilled : Goods"
          size="small"
          @click="$emit('like', reply.id)"
        >
        </el-button>
        <span class="like-count">{{ reply.likeCount }}</span>
      </div>
      
      <!-- 回复输入框（回复子回复时显示） -->
      <div v-if="showReplyInput" class="reply-input">
        <el-input
          ref="replyInputRef"
          :model-value="replyContent"
          @update:model-value="$emit('update-reply-content', $event)"
          type="textarea"
          :rows="2"
          :placeholder="`回复 ${replyTargetName}...`"
        />
        <div class="reply-actions">
          <el-button size="small" @click="$emit('cancel-reply')">取消</el-button>
          <el-button size="small" type="primary" @click="$emit('submit-reply', commentId)" :loading="submitting">
            提交
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Goods, GoodsFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import type { Reply } from '@/api/forum'

const props = defineProps<{
  reply: Reply
  commentId: number
  showReplyInput?: boolean
  replyContent?: string
  replyTargetName?: string
  submitting?: boolean
}>()

defineEmits<{
  reply: [reply: Reply, commentId: number]
  like: [replyId: number]
  delete: [replyId: number]
  submitReply: [commentId: number]
  cancelReply: []
  updateReplyContent: [content: string]
}>()

const userStore = useUserStore()
const replyInputRef = ref<any>(null)

// 监听 showReplyInput 变化，当显示时聚焦输入框
watch(() => props.showReplyInput, async (newVal) => {
  if (newVal) {
    await nextTick()
    // 使用 setTimeout 确保 DOM 完全渲染
    setTimeout(() => {
      // 方法1: 通过 ref 获取 textarea
      const textarea = replyInputRef.value?.$el?.querySelector('textarea') as HTMLTextAreaElement
      if (textarea) {
        textarea.focus()
        return
      }
      
      // 方法2: 通过 DOM 查询（备用方案）
      const replyItem = replyInputRef.value?.$el?.closest('.reply-item')
      if (replyItem) {
        const textareaElement = replyItem.querySelector('.reply-input textarea') as HTMLTextAreaElement
        if (textareaElement) {
          textareaElement.focus()
          return
        }
      }
      
      // 方法3: 尝试直接调用 focus 方法
      try {
        replyInputRef.value?.focus?.()
      } catch (e) {
        // 忽略错误
      }
    }, 150)
  }
})

const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
}
</script>

<style scoped>
.reply-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
  position: relative;
}

.reply-item .el-avatar {
  flex-shrink: 0;
  align-self: flex-start;
}

.reply-item:hover {
  background-color: var(--el-fill-color-lighter);
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 14px;
}

.reply-header .author {
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.reply-to {
  color: var(--el-color-primary);
  font-size: 12px;
}

.reply-header .time {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-left: auto;
}

.reply-text {
  margin-bottom: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--el-text-color-regular);
}

.reply-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-actions .like-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.reply-input {
  margin-top: 12px;
  padding: 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.reply-input .reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>

