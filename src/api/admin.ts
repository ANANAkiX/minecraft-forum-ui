import request from './request'
import type { ResourceListResponse } from './resource'

export interface User {
  id: number
  username: string
  nickname: string
  email: string
  avatar: string
  role: string
  status: number
  createTime: string
  updateTime: string
}

export interface Role {
  id: number
  name: string
  code: string
  description: string
  status: number
}

export interface RolePermission {
  id: number
  roleId: number
  permissionCode: string
  permissionName: string
}

export interface Permission {
  id: number
  code: string
  name: string
  type: string
  description: string
  parentId: number
  sortOrder: number
  status: number
  createTime: string
  updateTime: string
}

export interface SysFile {
  id: number
  resourceId?: number
  originalName: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  createUser?: number
  updateUser?: number
  createTime: string
  updateTime: string
}

export interface FileListParams {
  page?: number
  pageSize?: number
  keyword?: string
  resourceId?: number
}

export interface FileListResponse {
  list: SysFile[]
  total: number
  page: number
  pageSize: number
}

export interface UserListParams {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface UserListResponse {
  list: User[]
  total: number
  page: number
  pageSize: number
}

export const adminApi = {
  getUserList: (params: UserListParams) => 
    request.get<UserListResponse>('/admin/users', { params }),
  updateUserRole: (userId: number, role: string) => 
    request.put<User>(`/admin/users/${userId}/role`, { role }),
  updateUserStatus: (userId: number, status: number) => 
    request.put<User>(`/admin/users/${userId}/status`, { status }),
  getUserRoles: (userId: number) => 
    request.get<Role[]>(`/admin/users/${userId}/roles`),
  assignUserRole: (userId: number, roleId: number) => 
    request.post(`/admin/users/${userId}/roles`, { roleId }),
  removeUserRole: (userId: number, roleId: number) => 
    request.delete(`/admin/users/${userId}/roles/${roleId}`),
  getUserPermissions: (userId: number) => 
    request.get<{ all: Permission[], direct: Permission[], sources?: Record<string, string[]> }>(`/admin/users/${userId}/permissions`),
  assignPermissionToUser: (userId: number, permissionId: number) => 
    request.post(`/admin/users/${userId}/permissions`, { permissionId }),
  removePermissionFromUser: (userId: number, permissionId: number) => 
    request.delete(`/admin/users/${userId}/permissions/${permissionId}`),
  batchUpdateUserPermissions: (userId: number, permissionIds: number[]) => 
    request.put(`/admin/users/${userId}/permissions`, { permissionIds }),
  getAllPermissions: (type?: string) => 
    request.get<Permission[]>('/admin/permissions', { params: type ? { type } : {} }),
  getAllRoles: () => 
    request.get<Role[]>('/admin/roles'),
  createRole: (role: Partial<Role>) => 
    request.post<Role>('/admin/roles', role),
  updateRole: (roleId: number, role: Partial<Role>) => 
    request.put<Role>(`/admin/roles/${roleId}`, role),
  deleteRole: (roleId: number) => 
    request.delete(`/admin/roles/${roleId}`),
  getRolePermissions: (roleId: number) => 
    request.get<Permission[]>(`/admin/roles/${roleId}/permissions`),
  assignPermissionToRole: (roleId: number, permissionId: number) => 
    request.post(`/admin/roles/${roleId}/permissions`, { permissionId }),
  removePermissionFromRole: (roleId: number, permissionId: number) => 
    request.delete(`/admin/roles/${roleId}/permissions/${permissionId}`),
  batchUpdateRolePermissions: (roleId: number, permissionIds: number[]) => 
    request.put(`/admin/roles/${roleId}/permissions`, { permissionIds }),
  updateUserInfo: (userId: number, data: Partial<User>) => 
    request.put<User>(`/admin/users/${userId}`, data),
  getAllResources: (params: any) => 
    request.get<ResourceListResponse>('/admin/resources', { params }),
  updateResource: (id: number, data: any) => 
    request.put(`/admin/resources/${id}`, data),
  updatePost: (id: number, data: any) => 
    request.put(`/admin/posts/${id}`, data),
  getFileList: (params: FileListParams) => 
    request.get<FileListResponse>('/admin/files', { params }),
  deleteFile: (id: number) => 
    request.delete(`/admin/files/${id}`),
  getPermissionList: (params: { page?: number; pageSize?: number; keyword?: string; type?: string }) => 
    request.get<{ list: Permission[]; total: number; page: number; pageSize: number }>('/admin/permissions', { params }),
  createPermission: (permission: Partial<Permission>) => 
    request.post<Permission>('/admin/permissions', permission),
  updatePermission: (id: number, permission: Partial<Permission>) => 
    request.put<Permission>(`/admin/permissions/${id}`, permission),
  deletePermission: (id: number) => 
    request.delete(`/admin/permissions/${id}`)
}

