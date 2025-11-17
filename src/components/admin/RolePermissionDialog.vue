<template>
  <el-dialog 
    v-model="dialogVisible" 
    title="角色权限管理" 
    width="1400px"
    :show-overflow-tooltip="false"
    class="role-permission-dialog"
    @close="handleClose"
  >
    <div v-if="role">
      <p><strong>角色：</strong>{{ role.name }} ({{ role.code }})</p>
      <el-divider />
      <PermissionTreeTransfer
        v-model="rolePermissionIds"
        :data="permissionTree"
      />
      <div style="margin-top: 20px; display: flex; justify-content: center; gap: 16px;">
        <el-button type="primary" @click="handleSave">保存权限</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { adminApi, type Role, type PermissionTreeNode } from '@/api/admin'
import { ElMessage } from 'element-plus'
import PermissionTreeTransfer from '@/components/PermissionTreeTransfer.vue'

interface Props {
  modelValue: boolean
  role: Role | null
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

const rolePermissionIds = ref<number[]>([])
const originalRolePermissionIds = ref<number[]>([])
const permissionTree = ref<PermissionTreeNode[]>([])

const loadData = async () => {
  if (!props.role) return
  
  try {
    // 加载角色权限
    const permissions = await adminApi.getRolePermissions(props.role.id)
    rolePermissionIds.value = permissions.map(p => p.id)
    originalRolePermissionIds.value = [...rolePermissionIds.value]
    
    // 加载权限树
    permissionTree.value = await adminApi.getPermissionTree(false)
  } catch (error) {
    ElMessage.error('加载权限信息失败')
  }
}

const handleSave = async () => {
  if (!props.role) return
  
  try {
    await adminApi.batchUpdateRolePermissions(props.role.id, rolePermissionIds.value)
    ElMessage.success('权限保存成功')
    originalRolePermissionIds.value = [...rolePermissionIds.value]
    
    // 检查当前用户是否拥有此角色，如果是则刷新Token
    if (userStore.userInfo) {
      const currentUserRoles = await adminApi.getUserRoles(userStore.userInfo.id)
      const hasThisRole = currentUserRoles.some(r => r.id === props.role!.id)
      if (hasThisRole) {
        await userStore.refreshToken()
        ElMessage.info('权限已更新，已自动刷新您的权限')
      }
    }
    
    emit('refresh')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '权限保存失败')
  }
}

const handleReset = () => {
  rolePermissionIds.value = [...originalRolePermissionIds.value]
  ElMessage.info('已重置为原始权限')
}

const handleClose = () => {
  rolePermissionIds.value = []
  originalRolePermissionIds.value = []
  permissionTree.value = []
}

watch(() => props.modelValue, (val) => {
  if (val && props.role) {
    loadData()
  }
})

watch(() => props.role, (val) => {
  if (val && props.modelValue) {
    loadData()
  }
})
</script>

<style scoped>
/* 角色权限管理对话框样式优化 - 移除底部滚动条 */
:deep(.role-permission-dialog .el-dialog__body) {
  overflow: hidden !important;
  padding: 20px;
}
:deep(.role-permission-dialog .el-dialog) {
  overflow: hidden;
}
:deep(.role-permission-dialog) {
  overflow: hidden;
}
</style>

