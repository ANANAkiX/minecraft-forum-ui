// src/utils/auth.ts
// noinspection JSUnusedLocalSymbols

import {useRouter} from "vue-router";

const TOKEN_KEY = "token";
const router = useRouter()

/**
 * Token 现在是 UUID 格式，存储在 Redis 中
 * 前端无法解析 Token 内容，需要完全依赖后端 API 返回的权限信息
 */

/**
 * 检查 Token 是否过期
 * 由于 Token 现在是 UUID 格式，前端无法判断是否过期
 * 需要依赖后端返回的 401 错误来判断
 */
export function isTokenExpired(token: string | null): boolean {
  // Token 现在是 UUID，前端无法判断是否过期
  // 只要 Token 存在，就认为有效，让后端来判断
  return !token;
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
