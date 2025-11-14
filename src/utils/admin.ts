/**
 * 管理后台工具函数
 */

// 格式化日期时间：将 ISO 8601 格式转换为 "YYYY-MM-DD HH:mm:ss" 格式
export const formatDateTime = (time: string) => {
  if (!time) return '-'
  const date = new Date(time)
  if (isNaN(date.getTime())) return time // 如果无法解析，返回原值
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 格式化文件大小
export const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 获取状态类型
export const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger'
  }
  return types[status] || ''
}

// 获取状态文本
export const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝'
  }
  return texts[status] || status
}

