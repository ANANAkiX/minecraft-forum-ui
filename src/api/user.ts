import request from './request'

export interface LoginForm {
  username: string
  password: string
}

export interface RegisterForm {
  username: string
  password: string
  email: string
  nickname?: string
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  email: string
  avatar: string
  role: string
  status?: number
  createTime: string
  updateTime?: string
  permissions?: string[]
}

export interface TokenResponse {
  token: string
  user: UserInfo
}

export const userApi = {
  login: (data: LoginForm) => request.post<TokenResponse>('/auth/login', data),
  register: (data: RegisterForm) => request.post<TokenResponse>('/auth/register', data),
  getUserInfo: () => request.get<UserInfo>('/user/info'),
  updateUserInfo: (data: Partial<UserInfo>) => request.put('/user/info', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<string>('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}





