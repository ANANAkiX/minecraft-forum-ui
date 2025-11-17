/**
 * 权限控制配置文件
 * 统一管理所有页面的权限控制按键显示
 */

export interface PermissionConfigItem {
  /** 权限代码 */
  permissionCode: string
  /** 注释说明，控制哪个按钮或功能 */
  comment: string
}

/**
 * 后台管理页面标签页权限配置
 */
export const adminTabPermissions: Record<string, PermissionConfigItem> = {
  canAccessUserManagement: {
    permissionCode: 'admin:user:manage',
    comment: '控制用户管理标签页显示'
  },
  canAccessResourceManagement: {
    permissionCode: 'admin:resource:manage',
    comment: '控制资源管理标签页显示'
  },
  canAccessPostManagement: {
    permissionCode: 'admin:post:manage',
    comment: '控制帖子管理标签页显示'
  },
  canAccessRoleManagement: {
    permissionCode: 'admin:role:manage',
    comment: '控制角色管理标签页显示'
  },
  canAccessCategoryManagement: {
    permissionCode: 'admin:category:manage',
    comment: '控制分类配置标签页显示'
  },
  canAccessFileManagement: {
    permissionCode: 'admin:file:manage',
    comment: '控制文件管理标签页显示'
  },
  canAccessPermissionManagement: {
    permissionCode: 'admin:permission:manage',
    comment: '控制权限管理标签页显示'
  }
}

/**
 * 用户管理页面按钮权限配置
 */
export const userManagementButtonPermissions: Record<string, PermissionConfigItem> = {
  createUser: {
    permissionCode: 'admin:user:create',
    comment: '控制添加用户按钮显示'
  },
  readUser: {
    permissionCode: 'admin:user:read',
    comment: '控制读取用户列表权限'
  },
  editUser: {
    permissionCode: 'admin:user:update',
    comment: '控制编辑用户按钮显示'
  },
  manageRoles: {
    permissionCode: 'admin:user:role',
    comment: '控制角色分配按钮显示'
  },
  deleteUser: {
    permissionCode: 'admin:user:delete',
    comment: '控制删除用户按钮显示'
  }
}

/**
 * 资源管理页面按钮权限配置
 */
export const resourceManagementButtonPermissions: Record<string, PermissionConfigItem> = {
  readResource: {
    permissionCode: 'admin:resource:read',
    comment: '控制读取资源列表权限'
  },
  updateResource: {
    permissionCode: 'admin:resource:update',
    comment: '控制更新资源按钮显示'
  },
  deleteResource: {
    permissionCode: 'admin:resource:delete',
    comment: '控制删除资源按钮显示'
  }
}

/**
 * 帖子管理页面按钮权限配置
 */
export const postManagementButtonPermissions: Record<string, PermissionConfigItem> = {
  readPost: {
    permissionCode: 'admin:post:read',
    comment: '控制读取帖子列表权限'
  },
  updatePost: {
    permissionCode: 'admin:post:update',
    comment: '控制更新帖子按钮显示'
  },
  deletePost: {
    permissionCode: 'admin:post:delete',
    comment: '控制删除帖子按钮显示'
  }
}

/**
 * 角色管理页面按钮权限配置
 */
export const roleManagementButtonPermissions: Record<string, PermissionConfigItem> = {
  readRole: {
    permissionCode: 'admin:role:read',
    comment: '控制读取角色列表权限'
  },
  createRole: {
    permissionCode: 'admin:role:create',
    comment: '控制创建角色按钮显示'
  },
  updateRole: {
    permissionCode: 'admin:role:update',
    comment: '控制更新角色按钮显示'
  },
  managePermissions: {
    permissionCode: 'admin:role:update',
    comment: '控制权限管理按钮显示'
  },
  deleteRole: {
    permissionCode: 'admin:role:delete',
    comment: '控制删除角色按钮显示'
  }
}

/**
 * 权限管理页面按钮权限配置
 */
export const permissionManagementButtonPermissions: Record<string, PermissionConfigItem> = {
  readPermission: {
    permissionCode: 'admin:permission:read',
    comment: '控制读取权限列表权限'
  },
  createPermission: {
    permissionCode: 'admin:permission:create',
    comment: '控制创建权限按钮显示'
  },
  updatePermission: {
    permissionCode: 'admin:permission:update',
    comment: '控制更新权限按钮显示'
  },
  deletePermission: {
    permissionCode: 'admin:permission:delete',
    comment: '控制删除权限按钮显示'
  }
}

/**
 * 文件管理页面按钮权限配置
 */
export const fileManagementButtonPermissions: Record<string, PermissionConfigItem> = {
  readFile: {
    permissionCode: 'admin:file:read',
    comment: '控制读取文件列表权限'
  },
  downloadFile: {
    permissionCode: 'resource:download',
    comment: '控制下载文件按钮显示'
  },
  deleteFile: {
    permissionCode: 'admin:file:delete',
    comment: '控制删除文件按钮显示'
  }
}

/**
 * 所有权限配置的汇总
 */
export const allPermissionConfigs = {
  adminTabPermissions,
  userManagementButtonPermissions,
  resourceManagementButtonPermissions,
  postManagementButtonPermissions,
  roleManagementButtonPermissions,
  permissionManagementButtonPermissions,
  fileManagementButtonPermissions
}

