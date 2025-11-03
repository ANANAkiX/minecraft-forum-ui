<template>
  <div class="admin-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="用户管理" name="users">
        <el-table :data="userList" v-loading="userLoading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="nickname" label="昵称" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="role" label="角色">
            <template #default="scope">
              <el-tag :type="scope.row.role === 'ADMIN' ? 'danger' : 'default'">
                {{ scope.row.role === 'ADMIN' ? '管理员' : '用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="注册时间" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="handleEditUser(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDeleteUser(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="资源管理" name="resources">
        <el-table :data="resourceList" v-loading="resourceLoading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="authorName" label="作者" />
          <el-table-column prop="category" label="分类" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="发布时间" />
          <el-table-column label="操作" width="250">
            <template #default="scope">
              <el-button size="small" @click="handleViewResource(scope.row.id)">查看</el-button>
              <el-button
                size="small"
                type="success"
                v-if="scope.row.status === 'PENDING'"
                @click="handleApproveResource(scope.row.id)"
              >
                审核通过
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDeleteResource(scope.row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="帖子管理" name="posts">
        <el-table :data="postList" v-loading="postLoading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="authorName" label="作者" />
          <el-table-column prop="category" label="分类" />
          <el-table-column prop="viewCount" label="浏览" width="80" />
          <el-table-column prop="likeCount" label="点赞" width="80" />
          <el-table-column prop="createTime" label="发布时间" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="handleViewPost(scope.row.id)">查看</el-button>
              <el-button size="small" type="danger" @click="handleDeletePost(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { resourceApi } from '@/api/resource'
import { forumApi } from '@/api/forum'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const activeTab = ref('users')
const userLoading = ref(false)
const resourceLoading = ref(false)
const postLoading = ref(false)
const userList = ref<any[]>([])
const resourceList = ref<any[]>([])
const postList = ref<any[]>([])

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger'
  }
  return types[status] || ''
}

const loadUsers = async () => {
  userLoading.value = true
  try {
    // 这里应该调用用户列表API
    // userList.value = await adminApi.getUserList()
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    userLoading.value = false
  }
}

const loadResources = async () => {
  resourceLoading.value = true
  try {
    const result = await resourceApi.getResourceList({ page: 1, pageSize: 100 })
    resourceList.value = result.list
  } catch (error) {
    ElMessage.error('加载资源列表失败')
  } finally {
    resourceLoading.value = false
  }
}

const loadPosts = async () => {
  postLoading.value = true
  try {
    const result = await forumApi.getPostList({ page: 1, pageSize: 100 })
    postList.value = result.list
  } catch (error) {
    ElMessage.error('加载帖子列表失败')
  } finally {
    postLoading.value = false
  }
}

const handleEditUser = (user: any) => {
  ElMessage.info('编辑用户功能待实现')
}

const handleDeleteUser = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个用户吗？', '提示', {
      type: 'warning'
    })
    // 调用删除API
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error) {
    // 用户取消
  }
}

const handleViewResource = (id: number) => {
  router.push({ name: 'ResourceDetail', params: { id } })
}

const handleApproveResource = async (id: number) => {
  try {
    // 调用审核API
    ElMessage.success('审核通过')
    loadResources()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDeleteResource = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个资源吗？', '提示', {
      type: 'warning'
    })
    await resourceApi.deleteResource(id)
    ElMessage.success('删除成功')
    loadResources()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const handleViewPost = (id: number) => {
  router.push({ name: 'ForumPost', params: { id } })
}

const handleDeletePost = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个帖子吗？', '提示', {
      type: 'warning'
    })
    await forumApi.deletePost(id)
    ElMessage.success('删除成功')
    loadPosts()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadUsers()
  loadResources()
  loadPosts()
})
</script>

<style scoped>
.admin-page {
  padding: 20px 0;
}
</style>

