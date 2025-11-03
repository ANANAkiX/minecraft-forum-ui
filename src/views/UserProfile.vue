<template>
  <div class="user-profile">
    <el-card v-if="user">
      <div class="profile-header">
        <el-avatar :size="80" :src="user.avatar">{{ user.nickname }}</el-avatar>
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
    
    <el-tabs v-model="activeTab" style="margin-top: 20px">
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
    </el-tabs>
    
    <el-dialog
      v-model="showEditDialog"
      title="编辑资料"
      width="500px"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" />
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :auto-upload="false"
            :on-change="handleAvatarChange"
            :show-file-list="false"
          >
            <el-avatar v-if="editForm.avatar" :src="editForm.avatar" :size="100" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saveLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { userApi } from '@/api/user'
import { resourceApi } from '@/api/resource'
import { forumApi } from '@/api/forum'
import { useUserStore } from '@/stores/user'
import type { Resource } from '@/api/resource'
import type { ForumPost } from '@/api/forum'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'

const route = useRoute()
const userStore = useUserStore()

const user = ref<any>(null)
const activeTab = ref('resources')
const resourceLoading = ref(false)
const postLoading = ref(false)
const userResources = ref<Resource[]>([])
const userPosts = ref<ForumPost[]>([])
const showEditDialog = ref(false)
const saveLoading = ref(false)
const editForm = ref({
  nickname: '',
  avatar: ''
})

const userId = computed(() => parseInt(route.params.id as string))
const isOwnProfile = computed(() => userStore.userInfo?.id === userId.value)

const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
}

const loadUserInfo = async () => {
  try {
    // 这里应该调用获取用户信息的API
    // user.value = await userApi.getUserById(userId.value)
    user.value = userStore.userInfo
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

const handleAvatarChange = (file: UploadFile) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    editForm.value.avatar = e.target?.result as string
  }
  reader.readAsDataURL(file.raw as File)
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    await userStore.updateUserInfo(editForm.value)
    showEditDialog.value = false
    loadUserInfo()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

onMounted(() => {
  loadUserInfo()
  loadUserResources()
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

.avatar-uploader {
  cursor: pointer;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}
</style>

