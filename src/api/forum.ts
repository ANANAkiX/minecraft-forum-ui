import request from './request'

export interface Comment {
  id: number
  content: string
  authorId: number
  authorName: string
  authorAvatar: string
  createTime: string
  likeCount: number
  replies?: Reply[]
}

export interface Reply {
  id: number
  content: string
  authorId: number
  authorName: string
  authorAvatar: string
  targetUserId?: number
  targetUserName?: string
  createTime: string
  likeCount: number
}

export interface ForumPost {
  id: number
  title: string
  content: string
  category: string
  authorId: number
  authorName: string
  authorAvatar: string
  viewCount: number
  likeCount: number
  commentCount: number
  status: string
  createTime: string
  updateTime: string
  comments?: Comment[]
}

export interface PostListParams {
  page?: number
  pageSize?: number
  category?: string
  keyword?: string
}

export interface PostListResponse {
  list: ForumPost[]
  total: number
  page: number
  pageSize: number
}

export interface PostForm {
  title: string
  content: string
  category: string
}

export const forumApi = {
  getPostList: (params: PostListParams) => request.get<PostListResponse>('/forum/posts', { params }),
  getPostById: (id: number) => request.get<ForumPost>(`/forum/posts/${id}`),
  createPost: (data: PostForm) => request.post<ForumPost>('/forum/posts', data),
  updatePost: (id: number, data: Partial<PostForm>) => request.put(`/forum/posts/${id}`, data),
  deletePost: (id: number) => request.delete(`/forum/posts/${id}`),
  likePost: (id: number) => request.post(`/forum/posts/${id}/like`),
  unlikePost: (id: number) => request.delete(`/forum/posts/${id}/like`),
  createComment: (postId: number, content: string) => request.post<Comment>(`/forum/posts/${postId}/comments`, { content }),
  deleteComment: (commentId: number) => request.delete(`/forum/comments/${commentId}`),
  createReply: (commentId: number, content: string, targetUserId?: number) => 
    request.post<Reply>(`/forum/comments/${commentId}/replies`, { content, targetUserId }),
  deleteReply: (replyId: number) => request.delete(`/forum/replies/${replyId}`),
  likeComment: (commentId: number) => request.post(`/forum/comments/${commentId}/like`),
  likeReply: (replyId: number) => request.post(`/forum/replies/${replyId}/like`)
}

