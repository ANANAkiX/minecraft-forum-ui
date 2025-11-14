<template>
  <el-card>
    <template #header>
      <h2>{{ title }}</h2>
    </template>
    <el-form
      :model="form"
      :rules="rules"
      ref="formRef"
      label-width="100px"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入资源标题" />
      </el-form-item>
      <el-form-item label="简介" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入资源简介"
        />
      </el-form-item>
      <el-form-item label="分类" prop="category">
        <el-select v-model="form.category" placeholder="请选择分类">
          <el-option label="整合包" value="PACK" />
          <el-option label="MOD" value="MOD" />
          <el-option label="资源包" value="RESOURCE" />
        </el-select>
      </el-form-item>
      <el-form-item label="版本" prop="version">
        <el-input v-model="form.version" placeholder="例如：1.20.1" />
      </el-form-item>
      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          placeholder="选择或输入标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in commonTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="详细内容" prop="content">
        <div class="editor-wrapper">
          <v-md-editor
            ref="editorRef"
            v-model="form.content"
            height="400px"
            left-toolbar="undo redo clear | h bold italic strikethrough quote | ul ol table hr | link image code | save"
            right-toolbar="preview toc sync-scroll"
            @upload-img="handleImageUpload"
          />
        </div>
      </el-form-item>
      <el-form-item label="资源文件" prop="file">
        <el-upload
          class="upload-demo"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :file-list="fileList"
          :limit="10"
          multiple
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 zip、rar、jar 等格式，文件大小不超过 500MB，最多上传10个文件
              <span v-if="fileList.length > 0" style="margin-left: 10px; color: #409eff;">
                （当前已有 {{ fileList.length }} 个文件）
              </span>
            </div>
          </template>
        </el-upload>
      </el-form-item>
      <el-form-item 
        v-if="showStatus"
        label="审核状态" 
        prop="status"
      >
        <el-select v-model="form.status" placeholder="请选择审核状态">
          <el-option label="待审核" value="PENDING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="已拒绝" value="REJECTED" />
        </el-select>
      </el-form-item>
      <slot name="actions"></slot>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { fileApi } from '@/api/file'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import VMdEditor from '@kangc/v-md-editor'
import '@kangc/v-md-editor/lib/style/base-editor.css'
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js'
import '@kangc/v-md-editor/lib/theme/style/github.css'
import Prism from 'prismjs'

interface Props {
  title?: string
  modelValue?: {
    title?: string
    description?: string
    category?: string
    version?: string
    tags?: string[]
    content?: string
    status?: string
  }
  showStatus?: boolean
  fileList?: UploadFile[]
}

const props = withDefaults(defineProps<Props>(), {
  title: '上传资源',
  showStatus: false,
  fileList: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'file-change': [files: File[]]
  'file-remove': [file: UploadFile]
  'image-upload': [event: any, insertImage: any, files: FileList | File[]]
  'validate': [callback: (valid: boolean) => void]
  'reset': []
}>()

const userStore = useUserStore()

// 初始化 Markdown 编辑器
VMdEditor.use(githubTheme, {
  Prism
})

const formRef = ref<FormInstance>()
const editorRef = ref<any>(null)
const fileList = ref<UploadFile[]>([])

const commonTags = ['生存', '创造', 'PVP', 'PVE', 'RPG', '冒险', '建筑', '红石', '模组', '插件']

const form = reactive({
  title: '',
  description: '',
  category: '',
  version: '',
  tags: [] as string[],
  content: '',
  status: 'PENDING'
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入简介', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  version: [{ required: true, message: '请输入版本', trigger: 'blur' }],
  content: [{ required: true, message: '请输入详细内容', trigger: 'blur' }]
}

// 监听 props.modelValue 变化，同步到 form
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    Object.assign(form, {
      title: newVal.title || '',
      description: newVal.description || '',
      category: newVal.category || '',
      version: newVal.version || '',
      tags: newVal.tags || [],
      content: newVal.content || '',
      status: newVal.status || 'PENDING'
    })
  }
}, { immediate: true, deep: true })

// 监听 form 的各个字段变化，同步到外部
watch(() => form.title, () => emit('update:modelValue', { ...form }))
watch(() => form.description, () => emit('update:modelValue', { ...form }))
watch(() => form.category, () => emit('update:modelValue', { ...form }))
watch(() => form.version, () => emit('update:modelValue', { ...form }))
watch(() => form.tags, () => emit('update:modelValue', { ...form }), { deep: true })
watch(() => form.content, () => emit('update:modelValue', { ...form }))
watch(() => form.status, () => emit('update:modelValue', { ...form }))

// 监听 fileList props 变化
watch(() => props.fileList, (newVal) => {
  fileList.value = [...newVal]
}, { immediate: true, deep: true })

const handleFileChange = (file: UploadFile, uploadFileList: UploadFile[]) => {
  // 只有当文件是新添加的（有 raw 属性）时才处理
  if (file.raw) {
    // 收集所有新上传的文件（有 raw 属性的文件）
    const newFiles = uploadFileList
      .filter(f => f.raw)
      .map(f => f.raw as File)
    
    emit('file-change', newFiles)
  }
  
  // 更新 fileList.value 以保持 UI 同步
  fileList.value = uploadFileList
}

const handleFileRemove = (file: UploadFile) => {
  emit('file-remove', file)
  
  // 更新文件列表显示
  fileList.value = fileList.value.filter(f => f.uid !== file.uid)
  
  // 确保只包含仍然存在的、有 raw 属性的文件
  const remainingNewFiles = fileList.value
    .filter(f => f.raw)
    .map(f => f.raw as File)
  emit('file-change', remainingNewFiles)
}

const handleImageUpload = async (event: any, insertImage: any, files: FileList | File[]) => {
  emit('image-upload', event, insertImage, files)
}

// 设置粘贴图片处理
const setupPasteImageHandler = () => {
  if (!editorRef.value) return
  
  const editorElement = editorRef.value.$el || editorRef.value
  if (!editorElement) return
  
  const editorArea = editorElement.querySelector?.('.v-md-editor__editor-wrapper') || 
                     editorElement.querySelector?.('.v-md-editor__input-wrapper') ||
                     editorElement.querySelector?.('textarea') ||
                     editorElement
  
  if (!editorArea) return
  
  const handlePaste = async (e: ClipboardEvent) => {
    const clipboardData = e.clipboardData
    if (!clipboardData) return
    
    const items = Array.from(clipboardData.items)
    const imageItems = items.filter(item => item.type.indexOf('image') !== -1)
    
    if (imageItems.length === 0) return
    
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const uploadPromises = imageItems.map(async (item) => {
        const file = item.getAsFile()
        if (!file) return null
        return await fileApi.uploadFile(file)
      })
      
      const results = await Promise.all(uploadPromises)
      const validResults = results.filter(r => r !== null) as any[]
      
      const editorInstance = editorRef.value
      if (editorInstance && validResults.length > 0) {
        validResults.forEach(result => {
          if (editorInstance.insertImage) {
            editorInstance.insertImage({
              url: result.url,
              desc: result.name || '粘贴的图片'
            })
          } else {
            const imageMarkdown = `![${result.name || '图片'}](${result.url})\n`
            form.content += imageMarkdown
          }
        })
        
        ElMessage.success(`成功上传 ${validResults.length} 张图片`)
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '图片上传失败'
      ElMessage.error(errorMessage)
    }
  }
  
  editorArea.addEventListener('paste', handlePaste)
}

// 暴露方法给父组件
defineExpose({
  validate: (callback?: (valid: boolean) => void) => {
    if (!formRef.value) return
    formRef.value.validate((valid) => {
      if (callback) {
        callback(valid)
      } else {
        emit('validate', (valid: boolean) => {})
      }
    })
  },
  resetFields: () => {
    formRef.value?.resetFields()
    fileList.value = []
    emit('reset')
  },
  form,
  formRef
})

onMounted(() => {
  nextTick(() => {
    setupPasteImageHandler()
  })
})
</script>

<style scoped>
.editor-wrapper {
  width: 100%;
}

.upload-demo {
  width: 100%;
}
</style>

