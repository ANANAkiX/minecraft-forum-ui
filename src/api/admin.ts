import request from './request'
import type { ResourceListResponse } from './resource'

export interface User {
  id: number
  username: string
  nickname: string
  email: string
  avatar: string
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
  createTime?: string
  updateTime?: string
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
  router?: string // 访问权限的路由地址
  apiurl?: string // 操作权限的API地址
  methodtype?: string // 请求方式(GET/POST/PUT/DELETE)
  parentId: number
  sortOrder: number
  status: number
  createTime: string
  updateTime: string
}

export interface PermissionTreeNode {
  id: number
  code: string
  name: string
  type: string
  description: string
  router?: string
  apiurl?: string
  methodtype?: string
  parentId: number
  sortOrder: number
  status: number
  children?: PermissionTreeNode[]
}

export interface ApiInfo {
  url: string
  method: string
  description: string
  summary: string
  displayName?: string
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
  createUser: (user: Partial<User> & { password?: string }) => 
    request.post<User>('/admin/users', user),
  updateUserStatus: (userId: number, status: number) => 
    request.put<User>('/admin/users/status', { userId, status }),
  getUserRoles: (userId: number) => 
    request.get<Role[]>('/admin/users/roles', { params: { id: userId } }),
  assignUserRole: (userId: number, roleId: number) => 
    request.post('/admin/users/roles', { userId, roleId }),
  removeUserRole: (userId: number, roleId: number) => 
    request.delete('/admin/users/roles', { data: { userId, roleId } }),
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
    request.put<Role>('/admin/roles', { id: roleId, ...role }),
  deleteRole: (roleId: number) => 
    request.delete('/admin/roles', { data: { id: roleId } }),
  getRolePermissions: (roleId: number) => 
    request.get<Permission[]>('/admin/roles/permissions', { params: { id: roleId } }),
  assignPermissionToRole: (roleId: number, permissionId: number) => 
    request.post('/admin/roles/permissions', { roleId, permissionId }),
  removePermissionFromRole: (roleId: number, permissionId: number) => 
    request.delete('/admin/roles/permissions', { data: { roleId, permissionId } }),
  batchUpdateRolePermissions: (roleId: number, permissionIds: number[]) => 
    request.put('/admin/roles/permissions', { roleId, permissionIds }),
  updateUserInfo: (userId: number, data: Partial<User>) => 
    request.put<User>('/admin/users', { id: userId, ...data }),
  getAllResources: (params: any) => 
    request.get<ResourceListResponse>('/admin/resources', { params }),
  updateResource: (id: number, data: any) => 
    request.put('/admin/resources', { id, ...data }),
  updatePost: (id: number, data: any) => 
    request.put('/admin/posts', { id, ...data }),
  getFileList: (params: FileListParams) => 
    request.get<FileListResponse>('/admin/files', { params }),
  deleteFile: (id: number) => 
    request.delete('/admin/files', { data: { id } }),
  getPermissionList: (params: { page?: number; pageSize?: number; keyword?: string; type?: string }) => 
    request.get<{ list: Permission[]; total: number; page: number; pageSize: number }>('/admin/permissions', { params }),
  getPermissionTree: (includeDisabled?: boolean) => 
    request.get<PermissionTreeNode[]>('/admin/permissions/tree', { params: { includeDisabled } }),
  createPermission: (permission: Partial<Permission>) => 
    request.post<Permission>('/admin/permissions', permission),
  updatePermission: (id: number, permission: Partial<Permission>) => 
    request.put<Permission>('/admin/permissions', { id, ...permission }),
  deletePermission: (id: number) => 
    request.delete('/admin/permissions', { data: { id } }),
  getAllApis: () => 
    request.get<ApiInfo[]>('/admin/apis')
}

