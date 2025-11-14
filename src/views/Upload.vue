<template>
  <div class="upload-page">
    <ResourceForm
      ref="resourceFormRef"
      title="上传资源"
      v-model="form"
      :file-list="fileList"
      @file-change="handleFileChange"
      @file-remove="handleFileRemove"
      @image-upload="handleImageUpload"
      @validate="handleValidate"
      @reset="handleReset"
    >
      <template #actions>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading || uploading">
            {{ uploading ? '上传文件中...' : '提交' }}
          </el-button>
          <el-button @click="handleReset" :disabled="loading || uploading">重置</el-button>
        </el-form-item>
      </template>
    </ResourceForm>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { resourceApi } from '@/api/resource'
import { fileApi } from '@/api/file'
import type { UploadFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import ResourceForm from '@/components/ResourceForm.vue'

const router = useRouter()
const userStore = useUserStore()
const resourceFormRef = ref<any>(null)

// 页面级权限检查：如果没有page:upload权限，重定向到登录页
onMounted(() => {
  if (!userStore.isLoggedIn || !userStore.hasPermission('page:upload')) {
    ElMessage.warning('您没有访问上传资源页面的权限')
    router.push({name: 'Login'})
    return
  }
})

const loading = ref(false)
const uploading = ref(false)
const fileList = ref<UploadFile[]>([])
const uploadedFileUrls = ref<string[]>([]) // 存储已上传的文件URL
const formFiles = ref<File[]>([]) // 存储新上传的文件
const form = reactive({
  title: '',
  description: '',
  category: '',
  version: '',
  tags: [] as string[],
  content: '',
  status: 'PENDING'
})

const handleFileChange = (files: File[]) => {
  formFiles.value = files
}

const handleFileRemove = (file: UploadFile) => {
  // 从文件列表中移除
  if (file.raw) {
    formFiles.value = formFiles.value.filter(f => f !== file.raw)
  }
}

// 处理富文本编辑器图片上传
const handleImageUpload = async (_event: any, insertImage: any, files: FileList | File[]) => {
  uploading.value = true
  try {
    const fileArray = Array.from(files)
    const uploadPromises = fileArray.map(file => fileApi.uploadFile(file))
    const results = await Promise.all(uploadPromises)
    
    results.forEach(result => {
      insertImage({
        url: result.url,
        desc: result.name || '图片'
      })
    })
    
    ElMessage.success(`成功上传 ${results.length} 张图片`)
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || '图片上传失败'
    ElMessage.error(errorMessage)
  } finally {
    uploading.value = false
  }
}

const handleValidate = (callback: (valid: boolean) => void) => {
  if (!resourceFormRef.value) {
    callback(false)
    return
  }
  
  resourceFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 检查是否有文件需要上传
      if (formFiles.value.length === 0) {
        ElMessage.warning('请至少上传一个资源文件')
        callback(false)
        return
      }
    }
    callback(valid)
  })
}

const handleSubmit = async () => {
  if (!resourceFormRef.value) return
  
  resourceFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    
    // 检查是否有文件需要上传
    if (formFiles.value.length === 0) {
      ElMessage.warning('请至少上传一个资源文件')
      return
    }
    
    // 从 ResourceForm 组件获取最新的表单数据
    const formData = resourceFormRef.value?.form || form
    
    loading.value = true
    uploading.value = true
    try {
      // 第一步：先创建资源，获取资源ID
      ElMessage.info('正在创建资源...')
      
      // 确保使用最新的表单数据
      const resourceData = {
        title: formData.title || '',
        description: formData.description || '',
        content: formData.content || '',
        category: formData.category || '',
        version: formData.version || '',
        tags: formData.tags || []
      }
      
      console.log('提交的资源数据:', resourceData) // 调试用
      
      // 验证必填字段
      if (!resourceData.title || !resourceData.description || !resourceData.category || 
          !resourceData.version || !resourceData.content) {
        ElMessage.error('请填写完整的资源信息')
        loading.value = false
        uploading.value = false
        return
      }
      
      const createdResource = await resourceApi.createResource(resourceData)
      const resourceId = createdResource.id
      
      if (!resourceId) {
        ElMessage.error('创建资源失败，未获取到资源ID')
        return
      }
      
      // 第二步：上传所有文件到OSS，并关联资源ID
      ElMessage.info('正在上传文件...')
      const uploadResults = await fileApi.uploadFiles(formFiles.value, resourceId)
      uploadedFileUrls.value = uploadResults.map(r => r.url)
      
      if (uploadResults.length === 0) {
        ElMessage.error('文件上传失败，未获取到文件URL')
        return
      }
      
      ElMessage.success('资源上传成功！')
      router.push('/')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '上传失败'
      ElMessage.error(errorMessage)
      console.error('上传失败:', error)
    } finally {
      loading.value = false
      uploading.value = false
    }
  })
}

const handleReset = () => {
  resourceFormRef.value?.resetFields()
  fileList.value = []
  formFiles.value = []
  uploadedFileUrls.value = []
  Object.assign(form, {
    title: '',
    description: '',
    category: '',
    version: '',
    tags: [],
    content: '',
    status: 'PENDING'
  })
}
</script>

<style scoped>
.upload-page {
  padding: 20px 0;
}

.editor-wrapper {
  width: 100%;
}

.upload-demo {
  width: 100%;
}
</style>

