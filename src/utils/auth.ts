// src/utils/auth.ts

import {useRouter} from "vue-router";

const TOKEN_KEY = "token";
const router = useRouter()

/**
 * JWT Token 的 Payload 结构
 */
export interface JwtPayload {
  userId?: number
  username?: string
  role?: string
  permissions?: string[]
  exp?: number
  iat?: number
}

/**
 * 解析 JWT Token
 */
export function parseToken(token: string): JwtPayload | null {
  if (!token) {
    return null;
  }
  
  try {
    // 清理token字符串：去除首尾空格、换行符等
    const cleanToken = token.trim().replace(/\s+/g, '');
    
    // 检查token格式
    if (!cleanToken || cleanToken.length < 10) {
      return null;
    }
    
    const parts = cleanToken.split(".");
    if (parts.length !== 3) {
      return null;
    }
    
    // 检查每个部分是否为空
    if (!parts[0] || !parts[1] || !parts[2]) {
      return null;
    }
    
    // 解码payload部分
    // 注意：JWT使用base64url编码，需要先转换为标准base64
    // 同时需要处理Unicode字符（如中文用户名）
    let payloadStr: string;
    try {
      // 将base64url转换为base64
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      // 添加padding
      while (base64.length % 4) {
        base64 += '=';
      }
      
      // 使用atob解码得到二进制字符串
      const binaryString = atob(base64);
      
      // 将二进制字符串转换为UTF-8字符串
      // 方法：将每个字符的字节码转换为UTF-8字节数组，然后使用TextDecoder解码
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // 使用TextDecoder解码UTF-8
      const decoder = new TextDecoder('utf-8');
      payloadStr = decoder.decode(bytes);
    } catch (e) {
      // 如果TextDecoder不可用，尝试直接使用atob（对于不包含Unicode的情况）
      try {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        payloadStr = atob(base64);
      } catch (e2) {
        return null;
      }
    }
    
    // 解析JSON
    try {
      const payload = JSON.parse(payloadStr);
      return payload;
    } catch (e) {
      return null;
    }
  } catch (err) {
    return null;
  }
}

/**
 * 从 Token 中获取权限列表
 */
export function getPermissionsFromToken(token: string | null): string[] {
  if (!token) {
    return [];
  }
  const payload = parseToken(token);
  if (!payload || !payload.permissions) {
    return [];
  }
  if (!Array.isArray(payload.permissions)) {
    return [];
  }
  return payload.permissions;
}

/**
 * 从 Token 中获取用户ID
 */
export function getUserIdFromToken(token: string | null): number | null {
  if (!token) {
    return null;
  }
  const payload = parseToken(token);
  return payload?.userId ? Number(payload.userId) : null;
}

/**
 * 从 Token 中获取用户名
 */
export function getUsernameFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }
  const payload = parseToken(token);
  return payload?.username || null;
}

/**
 * 从 Token 中获取角色
 */
export function getRoleFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }
  const payload = parseToken(token);
  return payload?.role || null;
}

/**
 * 检查 Token 是否过期
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) {
    return true;
  }
  const payload = parseToken(token);
  if (!payload || !payload.exp) {
    return false; // 没有过期时间，认为有效
  }
  const now = Date.now() / 1000;
  return payload.exp < now;
}

/**
 * 获取当前 token
 */
export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * 设置 token（登录成功时调用）
 */
export function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 移除 token（退出登录时调用）
 */
export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

/**
 * 判断是否已登录
 * - 检查本地是否有 token
 * - 检查 token 是否过期（JWT 格式下解析 exp）
 */
export function toLogin() {
    if (!isLoggedIn()) {
        router.push("/login");
    }
}

export function isLoggedIn(): boolean {
    const token = getToken();
    if (!token) {
        return false;
    }
    return !isTokenExpired(token);
}

/**
 * 如果未登录则跳转到登录页
 * @param redirectBack 是否登录后返回原路径
 */
export function requireLogin(redirectBack: boolean = true) {
    if (!isLoggedIn()) {
        const loginUrl = "/login";
        if (redirectBack) {
            const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `${loginUrl}?redirect=${currentUrl}`;
        } else {
            window.location.href = loginUrl;
        }
    }
}
