import {createRouter, createWebHistory} from 'vue-router'
import {useUserStore} from '@/stores/user'
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
                meta: {title: '首页'}
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
                meta: {title: '上传资源', requiresAuth: true}
            },
            {
                path: 'forum',
                name: 'Forum',
                component: () => import('@/views/Forum.vue'),
                meta: {title: '论坛'}
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
                meta: {title: '后台管理', requiresAuth: true, requiresAdmin: true}
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
router.beforeEach((to, from, next) => {
    const userStore = useUserStore()

    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
        next({name: 'Login', query: {redirect: to.fullPath}})
    } else if (to.meta.requiresAdmin && !userStore.isAdmin) {
        next({name: 'Home'})
    } else {
        next()
    }
})

export default router





