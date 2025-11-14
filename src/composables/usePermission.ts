import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * 权限相关的 Composable
 * 提供便捷的权限检查方法
 */
export function usePermission() {
  const userStore = useUserStore()

  /**
   * 检查是否有指定权限
   */
  const hasPermission = (permissionCode: string): boolean => {
    return userStore.hasPermission(permissionCode)
  }

  /**
   * 检查是否有任意一个权限
   */
  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    return permissionCodes.some(code => userStore.hasPermission(code))
  }

  /**
   * 检查是否有所有权限
   */
  const hasAllPermissions = (permissionCodes: string[]): boolean => {
    return permissionCodes.every(code => userStore.hasPermission(code))
  }

  /**
   * 是否是管理员
   */
  const isAdmin = computed(() => userStore.isAdmin)

  /**
   * 当前用户的所有权限
   */
  const permissions = computed(() => userStore.permissions)

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    permissions
  }
}




