<template>
  <el-dialog v-model="dialogVisible" title="用户角色管理" width="600px" @close="handleClose">
    <div v-if="user">
      <p><strong>用户：</strong>{{ user.username }} ({{ user.nickname }})</p>
      <el-divider />
      <div style="margin-bottom: 20px;">
        <el-alert
          title="提示"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <div>
              <p>用户权限通过角色统一管理，请为用户分配相应的角色来授予权限。</p>
              <p style="margin-top: 5px; font-size: 12px; color: #999;">
                用户所有权限 = 通过角色获得的权限
              </p>
            </div>
          </template>
        </el-alert>
      </div>
      <el-divider />
      <h4>已分配角色</h4>
      <div style="margin-bottom: 20px;">
        <el-tag
          v-for="role in userRoles"
          :key="role.id"
          style="margin-right: 10px; margin-bottom: 10px"
          closable
          @close="handleRemoveRole(role.id)"
        >
          {{ role.name }}
        </el-tag>
        <el-tag v-if="userRoles.length === 0" type="info">暂无角色</el-tag>
      </div>
      <el-divider />
      <h4>分配新角色</h4>
      <el-select
        v-model="selectedRoleId"
        placeholder="选择角色"
        style="width: 200px; margin-right: 10px"
      >
        <el-option
          v-for="role in allRoles"
          :key="role.id"
          :label="role.name"
          :value="role.id"
          :disabled="userRoles.some(ur => ur.id === role.id)"
        />
      </el-select>
      <el-button type="primary" @click="handleAssignRole">分配</el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { adminApi, type User, type Role } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Props {
  modelValue: boolean
  user: User | null
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

const userRoles = ref<Role[]>([])
const allRoles = ref<Role[]>([])
const selectedRoleId = ref<number | null>(null)

const loadData = async () => {
  if (!props.user) return
  
  try {
    const roles = await adminApi.getUserRoles(props.user.id)
    userRoles.value = roles
    
    const allRolesData = await adminApi.getAllRoles()
    allRoles.value = allRolesData.filter(r => r.status === 1)
  } catch (error) {
    ElMessage.error('加载角色信息失败')
  }
}

const handleAssignRole = async () => {
  if (!selectedRoleId.value || !props.user) {
    ElMessage.warning('请选择角色')
    return
  }
  
  try {
    await adminApi.assignUserRole(props.user.id, selectedRoleId.value)
    ElMessage.success('角色分配成功')
    selectedRoleId.value = null
    await loadData()
    
    if (userStore.userInfo && props.user.id === userStore.userInfo.id) {
      await userStore.refreshToken()
      ElMessage.info('权限已更新，已自动刷新您的权限')
    }
    
    emit('refresh')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '角色分配失败')
  }
}

const handleRemoveRole = async (roleId: number) => {
  if (!props.user) return
  
  try {
    await ElMessageBox.confirm('确定要移除该角色吗？', '提示', {
      type: 'warning'
    })
    await adminApi.removeUserRole(props.user.id, roleId)
    ElMessage.success('角色移除成功')
    await loadData()
    
    if (userStore.userInfo && props.user.id === userStore.userInfo.id) {
      await userStore.refreshToken()
      ElMessage.info('权限已更新，已自动刷新您的权限')
    }
    
    emit('refresh')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('角色移除失败')
    }
  }
}

const handleClose = () => {
  selectedRoleId.value = null
  userRoles.value = []
  allRoles.value = []
}

watch(() => props.modelValue, (val) => {
  if (val && props.user) {
    loadData()
  }
})

watch(() => props.user, (val) => {
  if (val && props.modelValue) {
    loadData()
  }
})
</script>


