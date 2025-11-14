import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi, type UserInfo, type LoginForm, type RegisterForm } from '@/api/user'
import { configApi } from '@/api/config'
import { ElMessage } from 'element-plus'
import { 
  getPermissionsFromToken, 
  getUserIdFromToken, 
  getUsernameFromToken, 
  getRoleFromToken,
  isTokenExpired,
  parseToken
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
  // 从JWT中提取的权限列表（优先使用）
  const permissions = ref<string[]>([])
  // 系统配置：是否允许匿名访问首页和论坛
  const anonymousAccess = ref<boolean>(true) // 默认允许匿名访问

  const isLoggedIn = computed(() => {
    if (!token.value) return false
    return !isTokenExpired(token.value)
  })

  // 检查是否有访问后台管理的权限（page:admin）
  const isAdmin = computed(() => {
    // 优先从JWT中获取权限
    if (permissions.value.length > 0) {
      return permissions.value.includes('page:admin')
    }
    // 备用：从userInfo中获取
    if (!userInfo.value) return false
    // 兼容旧的角色判断，如果role是ADMIN也允许
    if (userInfo.value.role === 'ADMIN') return true
    // 检查是否有page:admin权限
    return userInfo.value.permissions?.includes('page:admin') || false
  })
  
  // 检查是否有特定权限
  const hasPermission = (permissionCode: string) => {
    // 优先从JWT中获取权限
    if (permissions.value.length > 0) {
      return permissions.value.includes(permissionCode)
    }
    // 备用：从userInfo中获取
    if (!userInfo.value) {
      return false
    }
    return userInfo.value.permissions?.includes(permissionCode) || false
  }

  // 从JWT Token中提取权限和用户信息
  const extractInfoFromToken = () => {
    if (!token.value) {
      permissions.value = []
      return
    }
    
    // 从JWT中提取权限
    const tokenPermissions = getPermissionsFromToken(token.value)
    permissions.value = tokenPermissions
    
    // 如果getPermissionsFromToken返回空，尝试手动解析
    if (tokenPermissions.length === 0) {
      try {
        const payload = parseToken(token.value)
        if (payload && payload.permissions && Array.isArray(payload.permissions)) {
          permissions.value = payload.permissions
        }
      } catch (e) {
        // 解析失败，保持空数组
      }
    }
    
    // 如果userInfo为空，尝试从token中构建基本信息
    if (!userInfo.value && token.value) {
      const userId = getUserIdFromToken(token.value)
      const username = getUsernameFromToken(token.value)
      const role = getRoleFromToken(token.value)
      
      if (userId && username) {
        userInfo.value = {
          id: userId,
          username: username,
          nickname: username,
          email: '',
          avatar: '',
          role: role || 'USER',
          permissions: tokenPermissions,
          createTime: ''
        }
      }
    } else if (userInfo.value) {
      // 更新权限信息
      userInfo.value.permissions = tokenPermissions
    }
  }

  // 登录
  const login = async (form: LoginForm) => {
    try {
      const response = await userApi.login(form)
      
      // 清理并验证token
      const rawToken = response.token
      if (!rawToken || typeof rawToken !== 'string') {
        ElMessage.error('登录失败：服务器返回的token无效')
        return false
      }
      
      // 清理token（去除可能的空格、换行等）
      const cleanToken = rawToken.trim().replace(/\s+/g, '')
      
      // 验证token格式
      const parts = cleanToken.split('.')
      if (parts.length !== 3) {
        ElMessage.error('登录失败：token格式错误')
        return false
      }
      
      token.value = cleanToken
      localStorage.setItem('token', cleanToken)
      
      // 从JWT中提取权限（优先，必须立即执行）
      extractInfoFromToken()
      
      // 同时获取完整的用户信息（包含权限信息，作为JWT解析失败的备用方案）
      // 等待fetchUserInfo完成，确保权限已设置
      try {
        await fetchUserInfo()
      } catch (error) {
        // 如果获取用户信息失败，至少使用JWT中的信息
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
      
      // 从JWT中提取权限（优先）
      extractInfoFromToken()
      
      // 同时获取完整的用户信息（作为备用）
      try {
        await fetchUserInfo()
      } catch (error) {
        // 如果获取用户信息失败，至少使用JWT中的信息
      }
      
      ElMessage.success('注册成功')
      return true
    } catch (error) {
      ElMessage.error('注册失败，请重试')
      return false
    }
  }

  // 获取用户信息（备用方法，用于获取头像等额外信息）
  const fetchUserInfo = async () => {
    if (!token.value) return
    try {
      const info = await userApi.getUserInfo()
      userInfo.value = info
      
      // 优先尝试从JWT中提取权限
      extractInfoFromToken()
      
      // 如果JWT解析失败或权限为空，但API返回了权限，则使用API返回的权限
      if (permissions.value.length === 0 && info.permissions && info.permissions.length > 0) {
        permissions.value = info.permissions
        if (userInfo.value) {
          userInfo.value.permissions = info.permissions
        }
      } else if (permissions.value.length > 0) {
        // JWT中有权限，同步到userInfo
        if (userInfo.value) {
          userInfo.value.permissions = permissions.value
        }
      } else {
        // 两者都没有权限
        if (userInfo.value) {
          userInfo.value.permissions = []
        }
      }
    } catch (error) {
      // 如果获取用户信息失败，尝试从JWT中提取基本信息
      extractInfoFromToken()
      // 如果JWT中也无法提取，则登出
      if (!userInfo.value) {
        logout()
      }
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
      
      // 从新Token中提取权限
      extractInfoFromToken()
      
      // 同时获取完整的用户信息
      try {
        await fetchUserInfo()
      } catch (error) {
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
    
    // 清空所有localStorage中的数据
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken') // 如果有刷新token也清除
    
    // 清空sessionStorage中的数据
    sessionStorage.clear()
  }

  // 初始化时从JWT中提取权限和用户信息
  if (token.value && !isTokenExpired(token.value)) {
    extractInfoFromToken()
    // 异步获取完整的用户信息（包含头像等）
    fetchUserInfo()
  } else if (token.value && isTokenExpired(token.value)) {
    // Token已过期，清除
    logout()
  }

  // 获取系统配置
  const fetchSystemConfig = async () => {
    try {
      const config = await configApi.getSystemConfig()
      anonymousAccess.value = config.anonymousAccess ?? true
    } catch (error) {
      // 如果获取配置失败，使用默认值（允许匿名访问）
      console.warn('获取系统配置失败，使用默认值', error)
      anonymousAccess.value = true
    }
  }

  return {
    token,
    userInfo,
    permissions,
    anonymousAccess,
    isLoggedIn,
    isAdmin,
    hasPermission,
    login,
    register,
    fetchUserInfo,
    updateUserInfo,
    logout,
    extractInfoFromToken,
    refreshToken,
    fetchSystemConfig
  }
})





