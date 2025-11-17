import { ElMessage } from 'element-plus'
import type { AxiosError } from 'axios'

/**
 * 错误处理工具函数
 * 统一处理 API 错误，避免重复代码
 */
export class ErrorHandler {
  /**
   * 处理 API 错误
   * @param error 错误对象
   * @param defaultMessage 默认错误消息
   * @param silent 是否静默处理（不显示消息）
   * @returns 错误消息
   */
  static handleApiError(
    error: any,
    defaultMessage: string = '操作失败',
    silent: boolean = false
  ): string {
    let errorMessage = defaultMessage

    // 处理 Axios 错误
    if (error?.response) {
      const response = error.response
      const data = response.data

      // 尝试从响应数据中获取错误消息
      if (data?.message) {
        errorMessage = data.message
      } else if (typeof data === 'string') {
        errorMessage = data
      } else {
        // 根据状态码设置默认消息
        switch (response.status) {
          case 400:
            errorMessage = '请求参数错误'
            break
          case 401:
            errorMessage = '未登录或登录已过期'
            break
          case 403:
            errorMessage = '无权限执行此操作'
            break
          case 404:
            errorMessage = '资源不存在'
            break
          case 500:
            errorMessage = '服务器内部错误'
            break
          case 503:
            errorMessage = '服务暂时不可用'
            break
          default:
            errorMessage = defaultMessage
        }
      }
    } else if (error?.message) {
      errorMessage = error.message
    }

    // 显示错误消息（除非静默模式）
    if (!silent) {
      ElMessage.error(errorMessage)
    }

    return errorMessage
  }

  /**
   * 处理文件下载错误
   * @param error 错误对象
   * @param defaultMessage 默认错误消息
   */
  static handleDownloadError(error: any, defaultMessage: string = '下载失败'): void {
    if (error?.response) {
      const status = error.response.status
      if (status === 403) {
        ElMessage.error('暂无下载权限，请联系管理员')
        return
      } else if (status === 404) {
        ElMessage.error('文件不存在')
        return
      }

      // 尝试解析 Blob 响应中的错误信息
      if (error.response.data instanceof Blob) {
        error.response.data.text().then((text: string) => {
          try {
            const errorData = JSON.parse(text)
            ElMessage.error(errorData.message || defaultMessage)
          } catch {
            ElMessage.error(defaultMessage)
          }
        }).catch(() => {
          ElMessage.error(defaultMessage)
        })
        return
      }
    }

    ElMessage.error(defaultMessage)
  }

  /**
   * 处理权限错误
   * @param permission 权限代码
   */
  static handlePermissionError(permission?: string): void {
    const message = permission 
      ? `无权限执行此操作，需要权限: ${permission}`
      : '无权限执行此操作'
    ElMessage.warning(message)
  }

  /**
   * 处理验证错误
   * @param error 错误对象
   */
  static handleValidationError(error: any): void {
    const message = error?.response?.data?.message || '请检查输入信息'
    ElMessage.warning(message)
  }
}

