import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi, type UserInfo, type LoginForm, type RegisterForm } from '@/api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')

  // 登录
  const login = async (form: LoginForm) => {
    try {
      const response = await userApi.login(form)
      token.value = response.token
      userInfo.value = response.user
      localStorage.setItem('token', response.token)
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
      userInfo.value = response.user
      localStorage.setItem('token', response.token)
      ElMessage.success('注册成功')
      return true
    } catch (error) {
      return false
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
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
    login,
    register,
    fetchUserInfo,
    updateUserInfo,
    logout
  }
})

