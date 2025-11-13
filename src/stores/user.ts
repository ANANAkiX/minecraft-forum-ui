import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi, type UserInfo, type LoginForm, type RegisterForm } from '@/api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  // 检查是否有访问后台管理的权限（page:admin）
  const isAdmin = computed(() => {
    if (!userInfo.value) return false
    // 兼容旧的角色判断，如果role是ADMIN也允许
    if (userInfo.value.role === 'ADMIN') return true
    // 检查是否有page:admin权限
    return userInfo.value.permissions?.includes('page:admin') || false
  })
  
  // 检查是否有特定权限
  const hasPermission = (permissionCode: string) => {
    if (!userInfo.value) return false
    return userInfo.value.permissions?.includes(permissionCode) || false
  }

  // 登录
  const login = async (form: LoginForm) => {
    debugger
    try {
      const response = await userApi.login(form)
      token.value = response.token
      localStorage.setItem('token', response.token)
      // 登录后立即获取完整的用户信息（包括权限）
      await fetchUserInfo()
      ElMessage.success('登录成功')
      return true
    } catch (error) {
      return false
    }
  }

  // 注册
  const register = async (form: RegisterForm) => {
    try {
      const response = await userApi.register(form)
      token.value = response.token
      localStorage.setItem('token', response.token)
      // 注册后立即获取完整的用户信息（包括权限）
      await fetchUserInfo()
      ElMessage.success('注册成功')
      return true
    } catch (error) {
      return false
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    debugger;
    if (!token.value) return
    try {
      const info = await userApi.getUserInfo()
      userInfo.value = info
    } catch (error) {
      logout()
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

  // 登出
  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  // 初始化时获取用户信息
  if (token.value) {
    fetchUserInfo()
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    hasPermission,
    login,
    register,
    fetchUserInfo,
    updateUserInfo,
    logout
  }
})





