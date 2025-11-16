<template>
  <div class="post-management">
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <el-input
        v-model="keyword"
        placeholder="搜索标题、内容"
        style="width: 300px"
        clearable
        @clear="loadPosts"
        @keyup.enter="loadPosts"
      >
        <template #append>
          <el-button @click="loadPosts">搜索</el-button>
        </template>
      </el-input>
      <el-input
        v-model="authorKeyword"
        placeholder="搜索作者（用户名、昵称、邮箱）"
        style="width: 300px"
        clearable
        @clear="loadPosts"
        @keyup.enter="loadPosts"
      >
        <template #append>
          <el-button @click="loadPosts">搜索</el-button>
        </template>
      </el-input>
      <div style="display: flex; gap: 10px; align-items: center;">
        <el-select v-model="category" placeholder="分类筛选" clearable style="width: 150px" @change="loadPosts">
          <el-option label="全部" value="" />
          <el-option label="分享" value="SHARE" />
          <el-option label="求助" value="HELP" />
          <el-option label="教程" value="TUTORIAL" />
          <el-option label="公告" value="ANNOUNCEMENT" />
        </el-select>
        <el-select v-model="sortBy" placeholder="排序方式" style="width: 150px" @change="loadPosts">
          <el-option label="发布时间" value="createTime" />
          <el-option label="浏览量" value="viewCount" />
          <el-option label="点赞量" value="likeCount" />
        </el-select>
      </div>
    </div>
    <el-table 
      :data="postList" 
      v-loading="loading" 
      style="width: 100%"
      @row-click="(row: any) => handleViewPost(row.id)"
      class="clickable-table"
    >
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="title" label="标题" align="center" />
      <el-table-column prop="authorName" label="作者" align="center" />
      <el-table-column prop="category" label="分类" align="center" />
      <el-table-column prop="viewCount" label="浏览" width="80" align="center" />
      <el-table-column prop="likeCount" label="点赞" width="80" align="center" />
      <el-table-column prop="createTime" label="发布时间" align="center">
        <template #default="scope">
          {{ formatDateTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="scope">
          <div style="display: flex; justify-content: center; gap: 8px;">
            <el-button 
              size="small" 
              @click.stop="handleEditPost(scope.row)"
              v-if="userStore.hasPermission('admin:post:update')"
            >
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click.stop="handleDeletePost(scope.row.id)"
              v-if="userStore.hasPermission('admin:post:delete')"
            >
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-if="total > 0"
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next, sizes"
      :page-sizes="[10, 20, 50, 100]"
      @current-change="loadPosts"
      @size-change="handlePageSizeChange"
      style="margin-top: 20px; justify-content: flex-end"
    />
    
    <!-- 帖子编辑对话框 -->
    <PostEditDialog
      v-model="editDialogVisible"
      :post="currentPost"
      @refresh="loadPosts"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { forumApi } from '@/api/forum'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/admin'
import PostEditDialog from './PostEditDialog.vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const postList = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const keyword = ref('')
const authorKeyword = ref('')
const category = ref('')
const sortBy = ref('createTime')

const editDialogVisible = ref(false)
const currentPost = ref<any>(null)

// 是否已加载过数据（防止重复加载）
const hasLoaded = ref(false)

const loadPosts = async () => {
  if (!userStore.hasPermission('admin:post:read')) {
    return
  }
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    if (authorKeyword.value) {
      params.authorKeyword = authorKeyword.value
    }
    if (category.value) {
      params.category = category.value
    }
    if (sortBy.value) {
      params.sortBy = sortBy.value
    }
    const result = await forumApi.getPostList(params)
    postList.value = result.list
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载帖子列表失败')
  } finally {
    loading.value = false
    hasLoaded.value = true
  }
}

const handlePageSizeChange = () => {
  page.value = 1
  loadPosts()
}

const handleViewPost = (id: number) => {
  router.push({ name: 'ForumPost', params: { id } })
}

const handleEditPost = (post: any) => {
  currentPost.value = post
  editDialogVisible.value = true
}

const handleDeletePost = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个帖子吗？', '提示', {
      type: 'warning'
    })
    await forumApi.deletePost(id)
    ElMessage.success('删除成功')
    
    if (postList.value.length === 1 && page.value > 1) {
      page.value--
    }
    loadPosts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  // 懒加载：只在组件挂载且未加载过时加载数据
  if (userStore.hasPermission('admin:post:read') && !hasLoaded.value) {
    loadPosts()
  }
})
</script>

<script lang="ts">
import { ElMessageBox } from 'element-plus'
export default {
  name: 'PostManagement'
}
</script>

<style scoped>
.post-management {
  width: 100%;
}

.clickable-table :deep(tbody tr) {
  cursor: pointer;
}
</style>

