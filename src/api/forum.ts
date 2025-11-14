import request from './request'

export interface Comment {
  id: number
  postId: number
  content: string
  authorId: number
  authorName: string
  authorAvatar: string
  createTime: string
  likeCount: number
  isLiked?: boolean
  replyCount?: number // 回复数量
  replies?: Reply[] // 子回复列表（可选，展开时加载）
}

export interface Reply {
  id: number
  commentId: number
  parentId?: number
  content: string
  authorId: number
  authorName: string
  authorAvatar: string
  targetUserId?: number
  targetUserName?: string
  createTime: string
  likeCount: number
  isLiked?: boolean
  children?: Reply[]
}

export interface CommentListResponse {
  list: Comment[]
  total: number
  page: number
  pageSize: number
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
  isLiked?: boolean // 当前用户是否已点赞
}

export interface PostListParams {
  page?: number
  pageSize?: number
  category?: string
  keyword?: string
  authorKeyword?: string
  sortBy?: string // createTime, viewCount, likeCount
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
  getCommentsByPostId: (postId: number, page: number = 1, pageSize: number = 10) => 
    request.get<CommentListResponse>(`/forum/posts/${postId}/comments`, { params: { page, pageSize } }),
  createComment: (postId: number, content: string) => request.post<Comment>(`/forum/posts/${postId}/comments`, { content }),
  deleteComment: (commentId: number) => request.delete(`/forum/comments/${commentId}`),
  createReply: (commentId: number, content: string, targetUserId?: number, parentId?: number) => 
    request.post<Reply>(`/forum/comments/${commentId}/replies`, { content, targetUserId, parentId }),
  deleteReply: (replyId: number) => request.delete(`/forum/replies/${replyId}`),
  likeComment: (commentId: number) => request.post(`/forum/comments/${commentId}/like`),
  unlikeComment: (commentId: number) => request.delete(`/forum/comments/${commentId}/like`),
  likeReply: (replyId: number) => request.post(`/forum/replies/${replyId}/like`),
  unlikeReply: (replyId: number) => request.delete(`/forum/replies/${replyId}/like`),
  getUserComments: (userId: number) => request.get<Comment[]>(`/forum/users/${userId}/comments`),
  getRepliesByCommentId: (commentId: number) => request.get<Reply[]>(`/forum/comments/${commentId}/replies`)
}






