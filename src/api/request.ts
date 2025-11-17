import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'
import { ErrorHandler } from '@/utils/errorHandler'

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

class Request {
  private instance: AxiosInstance

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config)
    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const userStore = useUserStore()
        const token = userStore.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

      // 响应拦截器
      this.instance.interceptors.response.use(
        (response: AxiosResponse<ApiResponse | Blob>) => {
          // 如果是 blob 响应（文件下载），直接返回
          if (response.data instanceof Blob) {
            return response.data
          }
          
          // 普通 JSON 响应
          const { code, message, data } = response.data as ApiResponse

          if (code === 200) {
            return data
          } else if (code === 401) {
            const userStore = useUserStore()
            // 只有在当前路由不是登录页时才显示消息和跳转
            // 并且只有在确实有Token的情况下才跳转（避免在登录/注册接口返回401时跳转）
            if (router.currentRoute.value.name !== 'Login' && userStore.token) {
              userStore.logout()
              router.push('/login')
              // 不显示消息，避免与路由守卫的消息重复
            }
            return Promise.reject(new Error(message || 'Unauthorized'))
          } else {
            // 对于登录接口，不在这里显示错误，让登录函数自己处理
            // 其他接口的错误在这里显示
            const url = (response.config?.url || '').toLowerCase()
            if (!url.includes('/login') && !url.includes('/register')) {
              ElMessage.error(message || '请求失败')
            }
            return Promise.reject(new Error(message || 'Request failed'))
          }
        },
        (error) => {
          const url = (error.config?.url || '').toLowerCase()
          const isAuthEndpoint = url.includes('/login') || url.includes('/register')
          
          // 如果是 blob 响应但出错了（通常是文件下载）
          if (error.response?.data instanceof Blob && error.response.status !== 200) {
            ErrorHandler.handleDownloadError(error)
            return Promise.reject(error)
          }
          
          // 处理 HTTP 状态码错误
          if (error.response) {
            // 401错误已在响应拦截器中处理
            if (error.response.status === 401) {
              return Promise.reject(error)
            }
            
            // 对于登录和注册接口，不在这里显示错误，让对应的函数自己处理
            if (isAuthEndpoint) {
              return Promise.reject(error)
            }
            
            // 使用统一的错误处理
            ErrorHandler.handleApiError(error)
          } else {
            // 没有响应，可能是网络错误
            // 对于登录和注册接口，不在这里显示错误
            if (!isAuthEndpoint) {
              ErrorHandler.handleApiError(error, '网络错误')
            }
          }
          
          return Promise.reject(error)
        }
      )
  }

  public request<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.instance.request(config)
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config)
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config)
  }
}

const request = new Request({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default request







