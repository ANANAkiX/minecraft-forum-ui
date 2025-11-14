import { defineStore } from 'pinia'
import { ref } from 'vue'
import { forumApi, type ForumPost } from '@/api/forum'

export const useHotPostsStore = defineStore('hotPosts', () => {
  const hotPosts = ref<ForumPost[]>([])
  const loading = ref(false)
  const hasLoaded = ref(false)

  const loadHotPosts = async () => {
    // 如果已经加载过数据且数据不为空，就不再重新加载
    if (hasLoaded.value && hotPosts.value.length > 0) {
      return
    }

    loading.value = true
    try {
      const result = await forumApi.getPostList({
        page: 1,
        pageSize: 5,
        sortBy: 'likeCount'
      })
      hotPosts.value = result.list.slice(0, 5)
      hasLoaded.value = true
    } catch (error) {
      // 静默失败，不影响主页面
    } finally {
      loading.value = false
    }
  }

  // 清除缓存（如果需要强制刷新时使用）
  const clearCache = () => {
    hotPosts.value = []
    hasLoaded.value = false
  }

  return {
    hotPosts,
    loading,
    hasLoaded,
    loadHotPosts,
    clearCache
  }
})

