import request from './request'

export interface FileUploadResponse {
  url: string
  name: string
  type: string
  size: number
  id?: number
}

export const fileApi = {
  uploadFile: (file: File, resourceId?: number) => {
    const formData = new FormData()
    formData.append('file', file)
    if (resourceId) {
      formData.append('resourceId', resourceId.toString())
    }
    return request.post<FileUploadResponse>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadFiles: (files: File[], resourceId?: number) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    if (resourceId) {
      formData.append('resourceId', resourceId.toString())
    }
    return request.post<FileUploadResponse[]>('/files/upload/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getFile: (id: number) => request.get('/files/detail', { params: { id } }),
  getFilesByResourceId: (resourceId: number) => request.get<SysFile[]>('/files/resource', { params: { resourceId } }),
  downloadFile: (id: number) => {
    // 使用 blob 方式下载文件
    return request.get('/files/download', {
      params: { id },
      responseType: 'blob'
    })
  },
  deleteFile: (id: number) => request.delete('/files', { data: { id } })
}

export interface SysFile {
  id: number
  resourceId?: number
  originalName: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  createTime: string
  updateTime: string
}

