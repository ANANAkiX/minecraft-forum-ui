<template>
  <div class="user-profile">
    <el-card v-if="user">
      <div class="profile-header">
        <el-avatar 
          :size="80" 
          :src="user.avatar"
          :class="['avatar-clickable', { 'avatar-editable': isOwnProfile }]"
          @click="handleAvatarClick">
          {{ user.nickname }}
        </el-avatar>
        <div class="profile-info">
          <h2>{{ user.nickname || user.username }}</h2>
          <p>用户名：{{ user.username }}</p>
          <p>邮箱：{{ user.email }}</p>
          <p>注册时间：{{ formatTime(user.createTime) }}</p>
        </div>
        <el-button
          v-if="isOwnProfile"
          type="primary"
          @click="showEditDialog = true"
        >
          编辑资料
        </el-button>
      </div>
    </el-card>
    
    <el-tabs v-model="activeTab" style="margin-top: 20px" @tab-change="handleTabChange">
      <el-tab-pane label="上传的资源" name="resources">
        <div class="resource-list" v-loading="resourceLoading">
          <el-card
            v-for="resource in userResources"
            :key="resource.id"
            class="resource-card"
            shadow="hover"
            @click="$router.push(`/resource/${resource.id}`)"
          >
            <h3>{{ resource.title }}</h3>
            <p>{{ resource.description }}</p>
            <div class="meta">
              <span>{{ resource.downloadCount }} 下载</span>
              <span>{{ resource.likeCount }} 点赞</span>
              <span>{{ formatTime(resource.createTime) }}</span>
            </div>
          </el-card>
          <el-empty v-if="!resourceLoading && userResources.length === 0" description="暂无资源" />
        </div>
      </el-tab-pane>
      <el-tab-pane label="发布的帖子" name="posts">
        <div class="post-list" v-loading="postLoading">
          <el-card
            v-for="post in userPosts"
            :key="post.id"
            class="post-card"
            shadow="hover"
            @click="$router.push(`/forum/post/${post.id}`)"
          >
            <h3>{{ post.title }}</h3>
            <p>{{ post.content.substring(0, 100) }}...</p>
            <div class="meta">
              <span>{{ post.viewCount }} 浏览</span>
              <span>{{ post.likeCount }} 点赞</span>
              <span>{{ formatTime(post.createTime) }}</span>
            </div>
          </el-card>
          <el-empty v-if="!postLoading && userPosts.length === 0" description="暂无帖子" />
        </div>
      </el-tab-pane>
      <el-tab-pane label="我的点赞" name="likes" v-if="isOwnProfile">
        <el-tabs v-model="likedSubTab" @tab-change="handleLikedSubTabChange">
          <el-tab-pane label="全部" name="all">
            <div class="content-list" v-loading="likedLoading">
              <el-card
                v-for="item in displayLikedItems"
                :key="`${item.type}-${item.id}`"
                class="content-card"
                shadow="hover"
                @click="goToContent(item)"
              >
                <h3>{{ item.title }}</h3>
                <p>{{ item.description || item.content?.substring(0, 100) }}</p>
                <div class="meta">
                  <el-tag :type="item.type === 'resource' ? 'success' : 'info'" size="small">
                    {{ item.type === 'resource' ? '资源' : '帖子' }}
                  </el-tag>
                  <span v-if="item.type === 'resource'">{{ item.downloadCount }} 下载</span>
                  <span v-else>{{ item.viewCount }} 浏览</span>
                  <span>{{ item.likeCount }} 点赞</span>
                  <span>{{ formatTime(item.createTime) }}</span>
                </div>
              </el-card>
              <el-empty v-if="!likedLoading && displayLikedItems.length === 0" description="暂无点赞的内容" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="资源" name="resources">
            <div class="resource-list" v-loading="likedLoading">
              <el-card
                v-for="resource in likedResources"
                :key="resource.id"
                class="resource-card"
                shadow="hover"
                @click="$router.push(`/resource/${resource.id}`)"
              >
                <h3>{{ resource.title }}</h3>
                <p>{{ resource.description }}</p>
                <div class="meta">
                  <span>{{ resource.downloadCount }} 下载</span>
                  <span>{{ resource.likeCount }} 点赞</span>
                  <span>{{ formatTime(resource.createTime) }}</span>
                </div>
              </el-card>
              <el-empty v-if="!likedLoading && likedResources.length === 0" description="暂无点赞的资源" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="帖子" name="posts">
            <div class="post-list" v-loading="likedLoading">
              <el-card
                v-for="post in likedPosts"
                :key="post.id"
                class="post-card"
                shadow="hover"
                @click="$router.push(`/forum/post/${post.id}`)"
              >
                <h3>{{ post.title }}</h3>
                <p>{{ post.content.substring(0, 100) }}...</p>
                <div class="meta">
                  <span>{{ post.viewCount }} 浏览</span>
                  <span>{{ post.likeCount }} 点赞</span>
                  <span>{{ formatTime(post.createTime) }}</span>
                </div>
              </el-card>
              <el-empty v-if="!likedLoading && likedPosts.length === 0" description="暂无点赞的帖子" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>
      <el-tab-pane label="我的评论" name="comments" v-if="isOwnProfile">
        <div class="comment-list" v-loading="commentLoading">
          <el-card
            v-for="comment in userComments"
            :key="comment.id"
            class="comment-card"
            shadow="hover"
            @click="goToComment(comment)"
          >
            <div class="comment-header">
              <h4>评论</h4>
              <span class="time">{{ formatTime(comment.createTime) }}</span>
            </div>
            <p class="comment-content">{{ comment.content }}</p>
            <div class="comment-meta">
              <el-tag size="small" type="info">帖子 #{{ comment.postId }}</el-tag>
              <span>{{ comment.likeCount }} 点赞</span>
              <span v-if="comment.replies && comment.replies.length > 0">
                {{ comment.replies.length }} 回复
              </span>
            </div>
          </el-card>
          <el-empty v-if="!commentLoading && userComments.length === 0" description="暂无评论" />
        </div>
      </el-tab-pane>
      <el-tab-pane label="我的收藏" name="favorites" v-if="isOwnProfile">
        <el-tabs v-model="favoriteSubTab" @tab-change="handleFavoriteSubTabChange">
          <el-tab-pane label="全部" name="all">
            <div class="content-list" v-loading="favoriteLoading">
              <el-card
                v-for="item in displayFavoriteItems"
                :key="`${item.type}-${item.id}`"
                class="content-card"
                shadow="hover"
                @click="goToContent(item)"
              >
                <h3>{{ item.title }}</h3>
                <p>{{ item.description || item.content?.substring(0, 100) }}</p>
                <div class="meta">
                  <el-tag :type="item.type === 'resource' ? 'success' : 'info'" size="small">
                    {{ item.type === 'resource' ? '资源' : '帖子' }}
                  </el-tag>
                  <span v-if="item.type === 'resource'">{{ item.downloadCount }} 下载</span>
                  <span v-else>{{ item.viewCount }} 浏览</span>
                  <span>{{ item.likeCount }} 点赞</span>
                  <span>{{ formatTime(item.createTime) }}</span>
                </div>
              </el-card>
              <el-empty v-if="!favoriteLoading && displayFavoriteItems.length === 0" description="暂无收藏的内容" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="资源" name="resources">
            <div class="resource-list" v-loading="favoriteLoading">
              <el-card
                v-for="resource in favoriteResources"
                :key="resource.id"
                class="resource-card"
                shadow="hover"
                @click="$router.push(`/resource/${resource.id}`)"
              >
                <h3>{{ resource.title }}</h3>
                <p>{{ resource.description }}</p>
                <div class="meta">
                  <span>{{ resource.downloadCount }} 下载</span>
                  <span>{{ resource.likeCount }} 点赞</span>
                  <span>{{ formatTime(resource.createTime) }}</span>
                </div>
              </el-card>
              <el-empty v-if="!favoriteLoading && favoriteResources.length === 0" description="暂无收藏的资源" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="帖子" name="posts">
            <div class="post-list" v-loading="favoriteLoading">
              <el-card
                v-for="post in favoritePosts"
                :key="post.id"
                class="post-card"
                shadow="hover"
                @click="$router.push(`/forum/post/${post.id}`)"
              >
                <h3>{{ post.title }}</h3>
                <p>{{ post.content.substring(0, 100) }}...</p>
                <div class="meta">
                  <span>{{ post.viewCount }} 浏览</span>
                  <span>{{ post.likeCount }} 点赞</span>
                  <span>{{ formatTime(post.createTime) }}</span>
                </div>
              </el-card>
              <el-empty v-if="!favoriteLoading && favoritePosts.length === 0" description="暂无收藏的帖子" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 编辑资料对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑资料"
      width="500px"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" type="email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saveLoading">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 头像编辑对话框 -->
    <el-dialog
      v-model="showAvatarDialog"
      title="修改头像"
      width="500px"
    >
      <div class="avatar-edit-container">
        <div class="avatar-preview">
          <h4>预览</h4>
          <el-avatar :size="150" :src="avatarPreview || user?.avatar">
            {{ user?.nickname }}
          </el-avatar>
        </div>
        <div class="avatar-upload">
          <el-upload
            class="avatar-uploader"
            :auto-upload="false"
            :on-change="handleAvatarChange"
            :show-file-list="false"
            accept="image/*"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择图片
            </el-button>
          </el-upload>
          <p class="upload-tip">支持 JPG、PNG 格式，文件大小不超过 2MB</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showAvatarDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAvatar" :loading="avatarUploading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userApi } from '@/api/user'
import { resourceApi } from '@/api/resource'
import { forumApi } from '@/api/forum'
import { useUserStore } from '@/stores/user'
import type { Resource } from '@/api/resource'
import type { ForumPost } from '@/api/forum'
import { Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const user = ref<any>(null)
const activeTab = ref('resources')
const resourceLoading = ref(false)
const postLoading = ref(false)
const likedLoading = ref(false)
const favoriteLoading = ref(false)
const userResources = ref<Resource[]>([])
const userPosts = ref<ForumPost[]>([])
const likedResources = ref<Resource[]>([])
const likedPosts = ref<ForumPost[]>([])
const favoriteResources = ref<Resource[]>([])
const favoritePosts = ref<ForumPost[]>([])
const likedSubTab = ref('all')
const favoriteSubTab = ref('all')
const showEditDialog = ref(false)
const showAvatarDialog = ref(false)
const saveLoading = ref(false)
const avatarUploading = ref(false)
const avatarPreview = ref<string>('')
const avatarFile = ref<File | null>(null)
const commentLoading = ref(false)
const userComments = ref<any[]>([])
const editForm = ref({
  nickname: '',
  email: ''
})

const userId = computed(() => parseInt(route.params.id as string))
const isOwnProfile = computed(() => userStore.userInfo?.id === userId.value)

const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
}

const loadUserInfo = async () => {
  try {
    if (isOwnProfile.value) {
      // 如果是自己的资料，使用store中的信息
      user.value = userStore.userInfo
      if (user.value) {
        editForm.value.nickname = user.value.nickname || ''
        editForm.value.email = user.value.email || ''
      }
    } else {
      // 如果是查看别人的资料，需要调用API（如果后端有的话）
      user.value = userStore.userInfo
    }
  } catch (error) {
    ElMessage.error('加载用户信息失败')
  }
}

const loadUserResources = async () => {
  resourceLoading.value = true
  try {
    const result = await resourceApi.getResourceList({ authorId: userId.value })
    userResources.value = result.list
  } catch (error) {
    ElMessage.error('加载资源失败')
  } finally {
    resourceLoading.value = false
  }
}

const loadUserPosts = async () => {
  postLoading.value = true
  try {
    const result = await forumApi.getPostList({ page: 1, pageSize: 20 })
    userPosts.value = result.list.filter(p => p.authorId === userId.value)
  } catch (error) {
    ElMessage.error('加载帖子失败')
  } finally {
    postLoading.value = false
  }
}

const loadLikedResources = async () => {
  if (!isOwnProfile.value) return
  likedLoading.value = true
  try {
    // 获取所有资源，然后过滤出已点赞的
    const result = await resourceApi.getResourceList({ page: 1, pageSize: 100 })
    // 过滤出当前用户点赞的资源（通过isLiked字段）
    likedResources.value = result.list.filter(r => r.isLiked === true)
  } catch (error) {
    ElMessage.error('加载点赞资源失败')
  } finally {
    likedLoading.value = false
  }
}

const loadLikedPosts = async () => {
  if (!isOwnProfile.value) return
  likedLoading.value = true
  try {
    // 获取所有帖子，然后过滤出已点赞的
    const result = await forumApi.getPostList({ page: 1, pageSize: 100 })
    // 过滤出当前用户点赞的帖子（通过isLiked字段）
    likedPosts.value = result.list.filter(p => p.isLiked === true)
  } catch (error) {
    ElMessage.error('加载点赞帖子失败')
  } finally {
    likedLoading.value = false
  }
}

const loadFavoriteResources = async () => {
  if (!isOwnProfile.value) return
  favoriteLoading.value = true
  try {
    // 获取所有资源，然后过滤出已收藏的
    const result = await resourceApi.getResourceList({ page: 1, pageSize: 100 })
    // 过滤出当前用户收藏的资源（通过isFavorited字段）
    favoriteResources.value = result.list.filter(r => r.isFavorited === true)
  } catch (error) {
    ElMessage.error('加载收藏资源失败')
  } finally {
    favoriteLoading.value = false
  }
}

const loadFavoritePosts = async () => {
  if (!isOwnProfile.value) return
  favoriteLoading.value = true
  try {
    // 获取所有帖子，然后过滤出已收藏的（如果有收藏帖子的功能）
    // 目前帖子没有收藏功能，所以这里先留空
    favoritePosts.value = []
  } catch (error) {
    ElMessage.error('加载收藏帖子失败')
  } finally {
    favoriteLoading.value = false
  }
}

// 显示全部点赞内容的计算属性
const displayLikedItems = computed(() => {
  const items: any[] = []
  likedResources.value.forEach(r => {
    items.push({
      ...r,
      type: 'resource',
      description: r.description
    })
  })
  likedPosts.value.forEach(p => {
    items.push({
      ...p,
      type: 'post',
      content: p.content
    })
  })
  // 按时间倒序排序
  return items.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
})

// 显示全部收藏内容的计算属性
const displayFavoriteItems = computed(() => {
  const items: any[] = []
  favoriteResources.value.forEach(r => {
    items.push({
      ...r,
      type: 'resource',
      description: r.description
    })
  })
  favoritePosts.value.forEach(p => {
    items.push({
      ...p,
      type: 'post',
      content: p.content
    })
  })
  // 按时间倒序排序
  return items.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
})

const goToContent = (item: any) => {
  if (item.type === 'resource') {
    router.push(`/resource/${item.id}`)
  } else {
    router.push(`/forum/post/${item.id}`)
  }
}

const handleLikedSubTabChange = (tabName: string) => {
  if (tabName === 'resources' && likedResources.value.length === 0) {
    loadLikedResources()
  } else if (tabName === 'posts' && likedPosts.value.length === 0) {
    loadLikedPosts()
  } else if (tabName === 'all') {
    // 加载所有数据
    if (likedResources.value.length === 0) {
      loadLikedResources()
    }
    if (likedPosts.value.length === 0) {
      loadLikedPosts()
    }
  }
}

const handleFavoriteSubTabChange = (tabName: string) => {
  if (tabName === 'resources' && favoriteResources.value.length === 0) {
    loadFavoriteResources()
  } else if (tabName === 'posts' && favoritePosts.value.length === 0) {
    loadFavoritePosts()
  } else if (tabName === 'all') {
    // 加载所有数据
    if (favoriteResources.value.length === 0) {
      loadFavoriteResources()
    }
    if (favoritePosts.value.length === 0) {
      loadFavoritePosts()
    }
  }
}

const loadUserComments = async () => {
  if (!isOwnProfile.value) return
  commentLoading.value = true
  try {
    userComments.value = await forumApi.getUserComments(userId.value)
  } catch (error) {
    ElMessage.error('加载评论失败')
  } finally {
    commentLoading.value = false
  }
}

const goToComment = async (comment: any) => {
  if (comment.postId) {
    // 先获取帖子标题（如果需要显示的话）
    try {
      const post = await forumApi.getPostById(comment.postId)
      router.push({
        path: `/forum/post/${comment.postId}`,
        query: { commentId: comment.id }
      })
    } catch (error) {
      // 如果帖子不存在，仍然尝试跳转
      router.push({
        path: `/forum/post/${comment.postId}`,
        query: { commentId: comment.id }
      })
    }
  }
}

const handleTabChange = (tabName: string) => {
  if (tabName === 'comments') {
    if (userComments.value.length === 0) {
      loadUserComments()
    }
  } else if (tabName === 'likes') {
    // 根据当前子tab加载数据
    handleLikedSubTabChange(likedSubTab.value)
  } else if (tabName === 'favorites') {
    // 根据当前子tab加载数据
    handleFavoriteSubTabChange(favoriteSubTab.value)
  }
}

const handleAvatarClick = () => {
  if (isOwnProfile.value) {
    showAvatarDialog.value = true
  }
}

const handleAvatarChange = (file: UploadFile) => {
  if (!file.raw) return
  
  // 检查文件大小（2MB）
  if (file.raw.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }
  
  // 检查文件类型
  if (!file.raw.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }
  
  avatarFile.value = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file.raw)
}

const handleSaveAvatar = async () => {
  if (!avatarFile.value) {
    ElMessage.warning('请先选择图片')
    return
  }
  
  avatarUploading.value = true
  try {
    const avatarUrl = await userApi.uploadAvatar(avatarFile.value)
    
    // 更新用户信息中的头像
    await userStore.updateUserInfo({ avatar: avatarUrl })
    
    // 更新本地显示
    if (user.value) {
      user.value.avatar = avatarUrl
    }
    
    ElMessage.success('头像上传成功')
    showAvatarDialog.value = false
    avatarPreview.value = ''
    avatarFile.value = null
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || '头像上传失败'
    ElMessage.error(errorMessage)
  } finally {
    avatarUploading.value = false
  }
}

const handleSave = async () => {
  if (!editForm.value.nickname || !editForm.value.email) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(editForm.value.email)) {
    ElMessage.warning('请输入有效的邮箱地址')
    return
  }
  
  saveLoading.value = true
  try {
    await userStore.updateUserInfo({
      nickname: editForm.value.nickname,
      email: editForm.value.email
    })
    showEditDialog.value = false
    await loadUserInfo()
    ElMessage.success('保存成功')
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || '保存失败'
    ElMessage.error(errorMessage)
  } finally {
    saveLoading.value = false
  }
}

onMounted(() => {
  loadUserInfo()
  loadUserResources()
  if (isOwnProfile.value) {
    loadUserPosts()
  }
})
</script>

<style scoped>
.user-profile {
  padding: 20px 0;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.profile-info {
  flex: 1;
}

.profile-info h2 {
  margin: 0 0 12px 0;
}

.profile-info p {
  margin: 8px 0;
  color: var(--el-text-color-secondary);
}

.resource-list,
.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resource-card,
.post-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.resource-card:hover,
.post-card:hover {
  transform: translateY(-2px);
}

.resource-card h3,
.post-card h3 {
  margin: 0 0 8px 0;
}

.resource-card p,
.post-card p {
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.avatar-clickable {
  transition: transform 0.2s;
}

.avatar-editable {
  cursor: pointer;
}

.avatar-editable:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.avatar-edit-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 20px 0;
}

.avatar-preview {
  text-align: center;
}

.avatar-preview h4 {
  margin: 0 0 16px 0;
  color: var(--el-text-color-primary);
}

.avatar-upload {
  text-align: center;
}

.upload-tip {
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.avatar-uploader {
  cursor: pointer;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-card {
  cursor: pointer;
  transition: all 0.3s;
}

.content-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.content-card h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.content-card p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
}

.content-card .meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.content-card .meta .el-tag {
  margin-right: 4px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.comment-card:hover {
  transform: translateY(-2px);
}

.comment-card .comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comment-card .comment-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.comment-card .comment-header .time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.comment-card .comment-content {
  margin: 0 0 12px 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.comment-card .comment-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

