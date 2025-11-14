<template>
  <div class="category-management">
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <el-radio-group v-model="categoryType" @change="handleCategoryTypeChange">
          <el-radio-button value="RESOURCE">资源分类</el-radio-button>
          <el-radio-button value="FORUM">论坛分类</el-radio-button>
        </el-radio-group>
      </div>
      <el-button type="primary" @click="handleAddCategory">添加分类</el-button>
    </div>
    <el-table :data="categoryList" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="名称" align="center" />
      <el-table-column prop="code" label="代码" align="center" />
      <el-table-column prop="sortOrder" label="排序" width="100" align="center" />
      <el-table-column prop="isDefault" label="默认" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.isDefault === 1 ? 'success' : 'info'">
            {{ scope.row.isDefault === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" align="center">
        <template #default="scope">
          {{ formatDateTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="scope">
          <div style="display: flex; justify-content: center; gap: 8px;">
            <el-button size="small" @click="handleEditCategory(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDeleteCategory(scope.row.id)">
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分类编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="代码" required>
          <el-input v-model="form.code" placeholder="请输入分类代码（如：PACK）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="默认显示">
          <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { categoryApi, type CategoryConfig } from '@/api/category'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '@/utils/admin'

const userStore = useUserStore()

const loading = ref(false)
const categoryList = ref<CategoryConfig[]>([])
const categoryType = ref('RESOURCE')

const dialogVisible = ref(false)
const dialogTitle = ref('添加分类')
const form = ref<Partial<CategoryConfig>>({
  name: '',
  code: '',
  type: 'RESOURCE',
  sortOrder: 0,
  isDefault: 0,
  status: 1
})

const loadCategories = async () => {
  if (!userStore.hasPermission('admin:category:manage')) {
    return
  }
  loading.value = true
  try {
    const configs = await categoryApi.getAllConfigs(categoryType.value)
    categoryList.value = configs
  } catch (error) {
    ElMessage.error('加载分类配置失败')
  } finally {
    loading.value = false
  }
}

const handleCategoryTypeChange = () => {
  form.value.type = categoryType.value
  loadCategories()
}

const handleAddCategory = () => {
  dialogTitle.value = '添加分类'
  form.value = {
    name: '',
    code: '',
    type: categoryType.value,
    sortOrder: 0,
    isDefault: 0,
    status: 1
  }
  dialogVisible.value = true
}

const handleEditCategory = (category: CategoryConfig) => {
  dialogTitle.value = '编辑分类'
  form.value = { ...category }
  dialogVisible.value = true
}

const handleSaveCategory = async () => {
  if (!form.value.name || !form.value.code) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    if (form.value.id) {
      await categoryApi.updateConfig(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await categoryApi.createConfig(form.value as CategoryConfig)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadCategories()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDeleteCategory = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个分类吗？', '提示', {
      type: 'warning'
    })
    await categoryApi.deleteConfig(id)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  if (userStore.hasPermission('admin:category:manage')) {
    loadCategories()
  }
})
</script>

<style scoped>
.category-management {
  width: 100%;
}
</style>

