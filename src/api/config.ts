import request from './request'

export interface SystemConfig {
  anonymousAccess: boolean
}

export const configApi = {
  getSystemConfig: () => request.get<SystemConfig>('/config/system')
}


