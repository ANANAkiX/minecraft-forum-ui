import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi, type UserInfo, type LoginForm, type RegisterForm } from '@/api/user'
import { configApi } from '@/api/config'
import { ElMessage } from 'element-plus'
import { 
  isTokenExpired
} from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  // 从localStorage获取token时也要清理（去除空格、换行等）
  const getStoredToken = () => {
    const stored = localStorage.getItem('token')
    if (!stored) return ''
    return stored.trim().replace(/\s+/g, '')
  }
  const token = ref<string>(getStoredToken())
  const userInfo = ref<UserInfo | null>(null)
  // 权限列表（从后端 API 获取）
  const permissions = ref<string[]>([])
  // 系统配置：是否允许匿名访问首页和论坛
  const anonymousAccess = ref<boolean>(true) // 默认允许匿名访问
  // 系统配置：是否开启Elasticsearch搜索
  const elasticsearchEnabled = ref<boolean>(true) // 默认开启Elasticsearch搜索
  // 是否正在加载用户信息（防止重复调用）
  const loadingUserInfo = ref<boolean>(false)

  const isLoggedIn = computed(() => {
    if (!token.value) return false
    // Token 现在是 UUID，前端无法判断是否过期，只要存在就认为有效
    // 后端会在 API 调用时验证 Token 有效性
    return true
  })

  // 检查是否有访问后台管理的权限（page:admin）
  const isAdmin = computed(() => {
    // 从 userInfo 中获取权限
    if (!userInfo.value) return false
    return userInfo.value.permissions?.includes('page:admin') || false
  })
  
  // 检查是否有特定权限
  const hasPermission = (permissionCode: string) => {
    // 从 userInfo 中获取权限
    if (!userInfo.value) {
      return false
    }
    return userInfo.value.permissions?.includes(permissionCode) || false
  }

  // 更新权限信息（从后端 API 返回的数据中提取）
  const updatePermissionsFromUserInfo = () => {
    if (userInfo.value && userInfo.value.permissions) {
      permissions.value = userInfo.value.permissions
    } else {
      permissions.value = []
    }
  }

  // 登录
  const login = async (form: LoginForm) => {
    try {
      const response = await userApi.login(form)
      
      // 清理并验证token（Token现在是UUID格式）
      const rawToken = response.token
      if (!rawToken || typeof rawToken !== 'string') {
        ElMessage.error('登录失败：服务器返回的token无效')
        return false
      }
      
      // 清理token（去除可能的空格、换行等）
      const cleanToken = rawToken.trim().replace(/\s+/g, '')
      
      token.value = cleanToken
      localStorage.setItem('token', cleanToken)
      
      // 获取完整的用户信息（包含权限）
      try {
        await fetchUserInfo()
      } catch (error) {
        // 如果获取用户信息失败，尝试使用返回的用户信息
        if (response.user) {
          userInfo.value = response.user
          updatePermissionsFromUserInfo()
        }
      }
      
      ElMessage.success('登录成功')
      return true
    } catch (error: any) {
      // 登录接口的错误统一在这里处理，响应拦截器不会显示登录接口的错误
      const responseData = error.response?.data
      
      // 优先显示后端返回的具体错误消息
      let errorMessage = '登录失败，请重试'
      
      if (responseData) {
        // 如果后端返回了 message 字段，使用它
        if (responseData.message) {
          errorMessage = responseData.message
        } else if (typeof responseData === 'string') {
          errorMessage = responseData
        }
      } else if (error.message && !error.message.includes('Request failed')) {
        // 如果有错误消息且不是通用的"Request failed"，使用它
        errorMessage = error.message
      }
      
      // 只显示一次错误消息
      ElMessage.error(errorMessage)
      return false
    }
  }

  // 注册
  const register = async (form: RegisterForm) => {
    try {
      const response = await userApi.register(form)
      token.value = response.token
      localStorage.setItem('token', response.token)
      
      // 获取完整的用户信息（包含权限）
      try {
        await fetchUserInfo()
      } catch (error) {
        // 如果获取用户信息失败，尝试使用返回的用户信息
        if (response.user) {
          userInfo.value = response.user
          updatePermissionsFromUserInfo()
        }
      }
      
      ElMessage.success('注册成功')
      return true
    } catch (error) {
      ElMessage.error('注册失败，请重试')
      return false
    }
  }

  // 获取用户信息（从后端 API 获取，包含最新权限）
  const fetchUserInfo = async () => {
    if (!token.value) {
      throw new Error('No token')
    }
    
    // 如果正在加载，等待加载完成
    if (loadingUserInfo.value) {
      // 等待加载完成（最多等待5秒）
      let waitCount = 0
      while (loadingUserInfo.value && waitCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        waitCount++
      }
      // 如果等待后仍然在加载，或者已经有用户信息，直接返回
      if (loadingUserInfo.value || userInfo.value) {
        return
      }
    }
    
    // 如果已经有用户信息，直接返回
    if (userInfo.value) {
      return
    }
    
    loadingUserInfo.value = true
    try {
      const info = await userApi.getUserInfo()
      userInfo.value = info
      
      // 从 API 返回的数据中更新权限
      updatePermissionsFromUserInfo()
    } catch (error: any) {
      // 如果获取用户信息失败（如 401），抛出错误让调用者处理
      // 不要在这里直接调用 logout()，因为可能是在路由守卫中调用的
      if (error?.response?.status === 401 || error?.response?.data?.code === 401) {
        // Token 无效，清除本地状态
        token.value = ''
        userInfo.value = null
        permissions.value = []
        localStorage.removeItem('token')
        throw error
      }
      throw error
    } finally {
      loadingUserInfo.value = false
    }
  }

  // 更新用户信息
  const updateUserInfo = async (data: Partial<UserInfo>) => {
    try {
      const info = await userApi.updateUserInfo(data)
      userInfo.value = { ...userInfo.value, ...info } as UserInfo
      ElMessage.success('更新成功')
      return true
    } catch (error) {
      return false
    }
  }

  // 刷新Token和权限
  const refreshToken = async () => {
    if (!token.value) return false
    try {
      const response = await userApi.refreshToken()
      token.value = response.token
      localStorage.setItem('token', response.token)
      
      // 强制重新获取用户信息（包含最新权限）
      // 先清除旧的用户信息，确保会重新获取
      const oldUserInfo = userInfo.value
      userInfo.value = null
      loadingUserInfo.value = false
      
      try {
        // 重新获取用户信息
        loadingUserInfo.value = true
        const info = await userApi.getUserInfo()
        userInfo.value = info
        updatePermissionsFromUserInfo()
      } catch (error) {
        // 如果获取用户信息失败，尝试使用返回的用户信息
        if (response.user) {
          userInfo.value = response.user
          updatePermissionsFromUserInfo()
        } else {
          // 如果都没有，恢复旧信息（避免丢失）
          userInfo.value = oldUserInfo
        }
      } finally {
        loadingUserInfo.value = false
      }
      
      return true
    } catch (error) {
      return false
    }
  }

  // 登出 - 清空所有数据包括Token
  const logout = () => {
    // 清空所有状态
    token.value = ''
    userInfo.value = null
    permissions.value = []
    anonymousAccess.value = true // 重置为默认值
    elasticsearchEnabled.value = true // 重置为默认值
    
    // 清空所有localStorage中的数据
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken') // 如果有刷新token也清除
    
    // 清空sessionStorage中的数据
    sessionStorage.clear()
  }

  // 初始化时不立即获取用户信息，由路由守卫在需要时获取
  // 这样可以避免重复调用，并且确保在路由守卫中统一处理错误

  // 获取系统配置
  const fetchSystemConfig = async () => {
    try {
      const config = await configApi.getSystemConfig()
      anonymousAccess.value = config.anonymousAccess ?? true
      elasticsearchEnabled.value = config.elasticsearchEnabled ?? true
    } catch (error) {
      // 如果获取配置失败，使用默认值
      console.warn('获取系统配置失败，使用默认值', error)
      anonymousAccess.value = true
      elasticsearchEnabled.value = true
    }
  }

  return {
    token,
    userInfo,
    permissions,
    anonymousAccess,
    elasticsearchEnabled,
    isLoggedIn,
    isAdmin,
    hasPermission,
    login,
    register,
    fetchUserInfo,
    updateUserInfo,
    logout,
    refreshToken,
    fetchSystemConfig
  }
})





