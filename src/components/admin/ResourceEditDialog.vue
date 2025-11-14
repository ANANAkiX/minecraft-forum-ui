<template>
  <el-dialog 
    v-model="dialogVisible" 
    title="编辑资源" 
    width="90%"
    :fullscreen="true"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="resource" style="padding: 0;">
      <ResourceForm
        ref="resourceFormRef"
        title="编辑资源"
        v-model="form"
        :file-list="fileList"
        :show-status="userStore.hasPermission('admin:resource:manage')"
        @file-change="handleFileChange"
        @file-remove="handleFileRemove"
        @image-upload="handleImageUpload"
      >
        <template #actions>
          <el-form-item>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSave" :loading="saving">
              保存
            </el-button>
          </el-form-item>
        </template>
      </ResourceForm>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { resourceApi } from '@/api/resource'
import { fileApi } from '@/api/file'
import { adminApi } from '@/api/admin'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import ResourceForm from '@/components/ResourceForm.vue'

interface Props {
  modelValue: boolean
  resource: any | null
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

const resourceFormRef = ref<any>(null)
const saving = ref(false)
const fileList = ref<UploadFile[]>([])
const originalFileIds = ref<number[]>([]) // 记录初始加载的文件ID列表
const deletedFileIds = ref<number[]>([]) // 记录被删除的文件ID列表
const formFiles = ref<File[]>([]) // 存储新上传的文件

const form = ref({
  title: '',
  description: '',
  category: '',
  version: '',
  tags: [] as string[],
  content: '',
  status: 'PENDING'
})

const loadResourceData = async () => {
  if (!props.resource) return
  
  try {
    const fullResource = await resourceApi.getResourceById(props.resource.id)
    form.value = {
      title: fullResource.title || '',
      description: fullResource.description || '',
      category: fullResource.category || '',
      version: fullResource.version || '',
      tags: fullResource.tags || [],
      content: fullResource.content || '',
      status: fullResource.status || 'PENDING'
    }
    
    // 加载资源关联的文件列表
    try {
      const files = await fileApi.getFilesByResourceId(props.resource.id)
      // 记录初始文件ID列表
      originalFileIds.value = files.map(file => file.id)
      // 将文件列表转换为 el-upload 组件需要的格式
      fileList.value = files.map(file => ({
        uid: file.id,
        name: file.fileName || file.originalName || '未知文件',
        url: file.fileUrl,
        status: 'success' as const,
        response: file
      }))
    } catch (error) {
      console.error('加载文件列表失败:', error)
      fileList.value = []
      originalFileIds.value = []
    }
  } catch (error) {
    ElMessage.error('加载资源信息失败')
  }
}

const handleFileChange = (files: File[]) => {
  formFiles.value = files
}

const handleFileRemove = (file: UploadFile) => {
  // 如果删除的是新上传的文件（有 raw 属性），从 formFiles 中移除
  if (file.raw) {
    formFiles.value = formFiles.value.filter(f => f !== file.raw)
  } else {
    // 如果删除的是已存在的文件（没有 raw 属性，但有 uid），记录到删除列表
    if (file.uid && typeof file.uid === 'number') {
      // 避免重复添加
      if (!deletedFileIds.value.includes(file.uid)) {
        deletedFileIds.value.push(file.uid)
      }
    }
  }
  
  // 更新文件列表显示
  fileList.value = fileList.value.filter(f => f.uid !== file.uid)
  
  // 确保 formFiles 只包含仍然存在的、有 raw 属性的文件
  const remainingNewFiles = fileList.value
    .filter(f => f.raw)
    .map(f => f.raw as File)
  formFiles.value = remainingNewFiles
}

const handleImageUpload = async (_event: any, insertImage: any, files: FileList | File[]) => {
  saving.value = true
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
    saving.value = false
  }
}

const handleSave = async () => {
  if (!resourceFormRef.value || !props.resource) return
  
  resourceFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    
    saving.value = true
    try {
      const resourceId = props.resource.id
      
      // 先删除被标记为删除的文件
      if (deletedFileIds.value.length > 0) {
        ElMessage.info(`正在删除 ${deletedFileIds.value.length} 个文件...`)
        const deletePromises = deletedFileIds.value.map(fileId => 
          fileApi.deleteFile(fileId).catch(error => {
            console.error(`删除文件 ${fileId} 失败:`, error)
            return null // 继续删除其他文件，不中断流程
          })
        )
        await Promise.all(deletePromises)
        ElMessage.success(`成功删除 ${deletedFileIds.value.length} 个文件`)
      }
      
      // 如果有新上传的文件，批量上传
      if (formFiles.value.length > 0) {
        ElMessage.info(`正在上传 ${formFiles.value.length} 个文件...`)
        const uploadResults = await fileApi.uploadFiles(formFiles.value, resourceId)
        
        if (uploadResults.length === 0) {
          throw new Error('文件上传失败')
        }
        
        ElMessage.success(`成功上传 ${uploadResults.length} 个文件`)
      }
      
      const updateData: any = {
        title: form.value.title,
        description: form.value.description,
        category: form.value.category,
        version: form.value.version,
        content: form.value.content
      }
      
      if (userStore.hasPermission('admin:resource:manage')) {
        updateData.status = form.value.status
      }
      
      await adminApi.updateResource(resourceId, updateData)
      
      ElMessage.success('保存成功')
      dialogVisible.value = false
      emit('refresh')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '保存失败'
      ElMessage.error(errorMessage)
    } finally {
      saving.value = false
    }
  })
}

const handleClose = () => {
  form.value = {
    title: '',
    description: '',
    category: '',
    version: '',
    tags: [],
    content: '',
    status: 'PENDING'
  }
  fileList.value = []
  originalFileIds.value = []
  deletedFileIds.value = []
  formFiles.value = []
  resourceFormRef.value?.resetFields()
}

watch(() => props.modelValue, (val) => {
  if (val && props.resource) {
    loadResourceData()
  }
})

watch(() => props.resource, (val) => {
  if (val && props.modelValue) {
    loadResourceData()
  }
})
</script>

<script lang="ts">
export default {
  name: 'ResourceEditDialog'
}
</script>

<style scoped>
</style>
