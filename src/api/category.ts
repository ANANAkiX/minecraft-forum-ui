import request from './request'

export interface CategoryConfig {
  id: number
  name: string
  code: string
  type: string
  sortOrder: number
  isDefault: number
  status: number
  createTime: string
  updateTime: string
}

export const categoryApi = {
  getEnabledConfigs: (type: string = 'RESOURCE') => 
    request.get<CategoryConfig[]>('/category-config/enabled', { params: { type } }),
  getAllConfigs: (type?: string) => 
    request.get<CategoryConfig[]>('/category-config', { params: type ? { type } : {} }),
  getConfigById: (id: number) => 
    request.get<CategoryConfig>('/category-config/detail', { params: { id } }),
  createConfig: (data: Partial<CategoryConfig>) => 
    request.post<CategoryConfig>('/category-config', data),
  updateConfig: (id: number, data: Partial<CategoryConfig>) => 
    request.put<CategoryConfig>('/category-config', { id, ...data }),
  deleteConfig: (id: number) => 
    request.delete('/category-config', { data: { id } })
}

