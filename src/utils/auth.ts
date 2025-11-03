// src/utils/auth.ts

import {useRouter} from "vue-router";
import {ElMessage} from "element-plus";

const TOKEN_KEY = "token";
const router = useRouter()


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
    if (!isLoggedIn) {
        router.push("/login");
    }
}

export function isLoggedIn(): boolean {
    const token = getToken();
    if (!token) {
        ElMessage.error('请先登录在进行操作');
        return false
    }
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const now = Date.now() / 1000;
        return payload.exp ? payload.exp > now : true; // 没有 exp 就默认有效
    } catch (err) {
        console.warn("无效的 token:", err);
        return false;
    }
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
