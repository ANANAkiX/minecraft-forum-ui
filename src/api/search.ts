import request from './request'

export interface SearchResult {
  type: 'POST' | 'RESOURCE'
  id: number
  title: string
  summary: string
  category: string
  authorName: string
  createTime: string
  highlights: string[]
}

export interface SearchParams {
  keyword: string
  page?: number
  pageSize?: number
}

export const searchApi = {
  search: (params: SearchParams) => 
    request.get<SearchResult[]>('/search', { params })
}


