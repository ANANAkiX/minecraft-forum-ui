import {createRouter, createWebHistory} from 'vue-router'
import {useUserStore} from '@/stores/user'
import {ElMessage} from 'element-plus'
import type {RouteRecordRaw} from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Layout',
        component: () => import('@/layouts/MainLayout.vue'),
        redirect: '/home',
        children: [
            {
                path: 'home',
                name: 'Home',
                component: () => import('@/views/Home.vue'),
                meta: {title: '首页', requiresPermission: 'page:home'}
            },
            {
                path: 'resource/:id',
                name: 'ResourceDetail',
                component: () => import('@/views/ResourceDetail.vue'),
                meta: {title: '资源详情'}
            },
            {
                path: 'upload',
                name: 'Upload',
                component: () => import('@/views/Upload.vue'),
                meta: {title: '上传资源', requiresAuth: true, requiresPermission: 'page:upload'}
            },
            {
                path: 'forum',
                name: 'Forum',
                component: () => import('@/views/Forum.vue'),
                meta: {title: '论坛', requiresPermission: 'page:forum'}
            },
            {
                path: 'forum/post/:id',
                name: 'ForumPost',
                component: () => import('@/views/ForumPost.vue'),
                meta: {title: '帖子详情'}
            },
            {
                path: 'user/:id',
                name: 'UserProfile',
                component: () => import('@/views/UserProfile.vue'),
                meta: {title: '用户中心'}
            },
            {
                path: 'admin',
                name: 'Admin',
                component: () => import('@/views/Admin.vue'),
                meta: {title: '后台管理', requiresAuth: true, requiresPermission: 'page:admin'}
            }
        ]
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: {title: '登录'}
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/Register.vue'),
        meta: {title: '注册'}
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: {title: '404'}
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// @ts-ignore
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()

    // 如果配置信息还未加载，先加载配置
    if (userStore.anonymousAccess === undefined || (to.name === 'Home' || to.name === 'Forum')) {
        await userStore.fetchSystemConfig()
    }

    // 如果用户已登录（有token）但用户信息还未加载，先加载用户信息
    if (userStore.isLoggedIn && !userStore.userInfo) {
        try {
            await userStore.fetchUserInfo()
        } catch (error) {
            // 如果获取用户信息失败（如401），说明Token无效，清除token并跳转到登录页
            console.warn('获取用户信息失败，Token可能已失效:', error)
            userStore.logout()
            if (to.name !== 'Login') {
                next({name: 'Login', query: {redirect: to.fullPath}})
            } else {
                next()
            }
            return
        }
    }

    // 检查是否需要登录
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
        next({name: 'Login', query: {redirect: to.fullPath}})
        return
    }

    // 检查页面权限（基于用户角色权限）
    if (to.meta.requiresPermission) {
        const permission = to.meta.requiresPermission as string
        
        // 如果允许匿名访问，且访问的是首页或论坛，则跳过权限检查
        if (userStore.anonymousAccess && (to.name === 'Home' || to.name === 'Forum')) {
            next()
            return
        }
        
        // 如果用户已登录但权限还未加载，先等待权限加载完成
        if (userStore.isLoggedIn && userStore.permissions.length === 0 && !userStore.userInfo) {
            // 权限还未获取，立即获取（这不应该发生，但作为安全措施）
            const token = localStorage.getItem('token')
            if (token) {
                try {
                    // 等待获取用户信息（包含权限）
                    await userStore.fetchUserInfo()
                } catch (error) {
                    // 如果获取用户信息失败（如401），说明Token无效，跳转到登录页
                    console.warn('获取用户信息失败，Token可能已失效:', error)
                    next({name: 'Login', query: {redirect: to.fullPath}})
                    return
                }
            }
        }
        
        // 检查权限 - 必须严格检查，无权限则拒绝访问
        if (!userStore.hasPermission(permission)) {
            // 如果没有权限，只在非登录页时显示提示并重定向（避免重复消息）
            if (to.name !== 'Login') {
                // 如果是从其他页面跳转过来的，显示提示
                if (from.name && from.name !== 'Login') {
                    ElMessage.warning('您没有访问此页面的权限')
                }
                next({name: 'Login', query: {redirect: to.fullPath}})
            } else {
                // 如果已经在登录页，直接阻止访问，不显示消息
                next(false)
            }
            return
        }
    }

    // 兼容旧的 requiresAdmin 检查（使用 page:admin 权限）
    if (to.meta.requiresAdmin && !userStore.hasPermission('page:admin')) {
        ElMessage.warning('您没有访问后台管理的权限')
        // 避免循环重定向：如果Home也需要权限，则跳转到登录页
        if (to.name !== 'Login') {
            next({name: 'Login', query: {redirect: to.fullPath}})
        } else {
            next(false)
        }
        return
    }

    next()
})

export default router






