import { computed, type ComputedRef } from 'vue'
import { useUserStore } from '@/stores/user'
import type { PermissionConfigItem } from '@/config/permission-config'

/**
 * 权限控制 Composable
 * 根据配置文件生成权限检查的计算属性
 */
export function usePermission() {
  const userStore = useUserStore()

  /**
   * 根据权限配置生成计算属性
   * @param config 权限配置对象
   * @returns 包含所有权限检查计算属性的对象
   */
  function createPermissionChecks<T extends Record<string, PermissionConfigItem>>(
    config: T
  ): Record<keyof T, ComputedRef<boolean>> {
    const checks = {} as Record<keyof T, ComputedRef<boolean>>
    
    for (const [key, item] of Object.entries(config)) {
      checks[key as keyof T] = computed(() => {
        return userStore.hasPermission(item.permissionCode)
      })
    }
    
    return checks
  }

  /**
   * 从配置中获取权限代码
   * @param config 权限配置对象
   * @param key 配置键名
   * @returns 权限代码
   */
  function getPermissionCode<T extends Record<string, PermissionConfigItem>>(
    config: T,
    key: keyof T
  ): string {
    return config[key]?.permissionCode || ''
  }

  /**
   * 检查单个权限（兼容旧代码）
   * @param permissionCode 权限代码
   * @returns 是否有权限
   */
  function hasPermission(permissionCode: string): boolean {
    return userStore.hasPermission(permissionCode)
  }

  return {
    createPermissionChecks,
    getPermissionCode,
    hasPermission
  }
}
