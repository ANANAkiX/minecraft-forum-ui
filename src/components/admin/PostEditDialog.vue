<template>
  <el-dialog v-model="dialogVisible" title="编辑帖子" width="800px" @close="handleClose">
    <el-form :model="form" label-width="100px" v-if="post">
      <el-form-item label="标题" required>
        <el-input v-model="form.title" placeholder="请输入帖子标题" />
      </el-form-item>
      <el-form-item label="分类" required>
        <el-select v-model="form.category" placeholder="请选择分类">
          <el-option label="分享" value="SHARE" />
          <el-option label="求助" value="HELP" />
          <el-option label="教程" value="TUTORIAL" />
          <el-option label="公告" value="ANNOUNCEMENT" />
        </el-select>
      </el-form-item>
      <el-form-item label="内容" required>
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="10"
          placeholder="请输入帖子内容（支持Markdown）"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { forumApi } from '@/api/forum'
import { adminApi } from '@/api/admin'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  post: any | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'refresh': []
}>()

const userStore = useUserStore()
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = ref({
  title: '',
  category: '',
  content: ''
})

const loadPostData = async () => {
  if (!props.post) return
  
  try {
    const fullPost = await forumApi.getPostById(props.post.id)
    form.value = {
      title: fullPost.title,
      category: fullPost.category,
      content: fullPost.content
    }
  } catch (error) {
    ElMessage.error('加载帖子信息失败')
  }
}

const handleSave = async () => {
  if (!props.post) return
  
  if (!form.value.title || !form.value.category || !form.value.content) {
    ElMessage.warning('请填写必填项')
    return
  }
  
  try {
    await adminApi.updatePost(props.post.id, {
      title: form.value.title,
      category: form.value.category,
      content: form.value.content
    })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    emit('refresh')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  }
}

const handleClose = () => {
  form.value = {
    title: '',
    category: '',
    content: ''
  }
}

watch(() => props.modelValue, (val) => {
  if (val && props.post) {
    loadPostData()
  }
})

watch(() => props.post, (val) => {
  if (val && props.modelValue) {
    loadPostData()
  }
})
</script>

<style scoped>
</style>

