import request from './request'

export interface Resource {
  id: number
  title: string
  description: string
  content: string
  category: string
  version: string
  tags: string[]
  authorId: number
  authorName: string
  authorAvatar: string
  downloadCount: number
  likeCount: number
  favoriteCount: number
  thumbnailUrl: string
  status: string
  createTime: string
  updateTime: string
  isLiked?: boolean // 当前用户是否已点赞
  isFavorited?: boolean // 当前用户是否已收藏
}

export interface ResourceListParams {
  page?: number
  pageSize?: number
  category?: string
  keyword?: string
  authorId?: number
  tags?: string[]
}

export interface ResourceListResponse {
  list: Resource[]
  total: number
  page: number
  pageSize: number
}

export interface ResourceForm {
  title: string
  description: string
  content: string
  category: string
  version: string
  tags: string[]
  file?: File
}

export const resourceApi = {
  getResourceList: (params: ResourceListParams) => request.get<ResourceListResponse>('/resource/list', { params }),
  getResourceById: (id: number) => request.get<Resource>(`/resource/${id}`),
  createResource: (data: ResourceForm | any) => {
    // 始终使用 FormData 格式，因为后端接口使用 @RequestParam
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('content', data.content)
    formData.append('category', data.category)
    formData.append('version', data.version)
    formData.append('tags', JSON.stringify(data.tags || []))
    
    // 注意：不再传递文件或 fileUrl，文件通过文件接口单独上传并关联资源ID
    
    return request.post<Resource>('/resource', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  updateResource: (id: number, data: Partial<ResourceForm>) => request.put(`/resource/${id}`, data),
  deleteResource: (id: number) => request.delete(`/resource/${id}`),
  likeResource: (id: number) => request.post(`/resource/${id}/like`),
  unlikeResource: (id: number) => request.delete(`/resource/${id}/like`),
  favoriteResource: (id: number) => request.post(`/resource/${id}/favorite`),
  unfavoriteResource: (id: number) => request.delete(`/resource/${id}/favorite`),
  downloadResource: (id: number) => request.post(`/resource/${id}/download`)
}








