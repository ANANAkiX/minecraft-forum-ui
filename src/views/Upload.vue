<template>
  <div class="upload-page">
    <el-card>
      <template #header>
        <h2>上传资源</h2>
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
              v-model="form.content"
              height="400px"
              left-toolbar="undo redo clear | h bold italic strikethrough quote | ul ol table hr | link image code | save"
              right-toolbar="preview toc sync-scroll"
            />
          </div>
        </el-form-item>
        <el-form-item label="资源文件" prop="file">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            :limit="1"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 zip、rar、jar 等格式，文件大小不超过 500MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            提交
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { resourceApi } from '@/api/resource'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import VMdEditor from '@kangc/v-md-editor'
import '@kangc/v-md-editor/lib/style/base-editor.css'
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js'
import '@kangc/v-md-editor/lib/theme/style/github.css'
import Prism from 'prismjs'

const router = useRouter()

VMdEditor.use(githubTheme, {
  Prism
})

const formRef = ref<FormInstance>()
const loading = ref(false)
const fileList = ref<UploadFile[]>([])
const form = reactive({
  title: '',
  description: '',
  category: '',
  version: '',
  tags: [] as string[],
  content: '',
  file: null as File | null
})

const commonTags = ['生存', '创造', 'PVP', 'PVE', 'RPG', '冒险', '建筑', '红石', '模组', '插件']

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入简介', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  version: [{ required: true, message: '请输入版本', trigger: 'blur' }],
  content: [{ required: true, message: '请输入详细内容', trigger: 'blur' }],
  file: [{ required: true, message: '请上传文件', trigger: 'change' }]
}

const handleFileChange = (file: UploadFile) => {
  form.file = file.raw as File
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await resourceApi.createResource(form)
        ElMessage.success('上传成功')
        router.push('/')
      } catch (error) {
        ElMessage.error('上传失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleReset = () => {
  formRef.value?.resetFields()
  fileList.value = []
  form.file = null
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

