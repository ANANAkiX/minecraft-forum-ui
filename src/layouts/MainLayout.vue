<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="header-content">
        <div class="logo" @click="$router.push('/')">
          <el-icon><Grid /></el-icon>
          <span>Minecraft 论坛</span>
        </div>
        <el-menu
          mode="horizontal"
          :default-active="activeMenu"
          class="header-menu"
          @select="handleMenuSelect"
        >
          <!-- 首页：需要 page:home 权限或允许匿名访问 -->
          <el-menu-item index="home" v-if="userStore.hasPermission('page:home') || userStore.anonymousAccess">首页</el-menu-item>
          <!-- 论坛：需要 page:forum 权限或允许匿名访问 -->
          <el-menu-item index="forum" v-if="userStore.hasPermission('page:forum') || userStore.anonymousAccess">论坛</el-menu-item>
          <!-- 上传资源：需要登录且有 page:upload 权限 -->
          <el-menu-item index="upload" v-if="userStore.isLoggedIn && userStore.hasPermission('page:upload')">上传资源</el-menu-item>
          <!-- 后台管理：需要 page:admin 权限 -->
          <el-menu-item index="admin" v-if="userStore.hasPermission('page:admin')">后台管理</el-menu-item>
          <!-- 动态标题 - 使用 menu-item 样式，与导航菜单一致 -->
          <el-menu-item
            v-for="title in orderedTitleList"
            :key="pageTitle.getTitleKey(title)"
            :index="`title-${pageTitle.getTitleKey(title)}`"
            :class="{ 'is-active': isTitleActive(title) }"
            class="dynamic-title-item"
            @click="handleTitleClick(title)"
          >
            <span class="title-text">{{ pageTitle.getFormattedTitle(title) }}</span>
            <el-button
              text
              :icon="Close"
              @click.stop="handleTitleClose(title)"
              class="close-btn"
              size="small"
            />
          </el-menu-item>
        </el-menu>
        <div class="header-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索资源..."
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-switch
            v-model="isDark"
            inline-prompt
            :active-icon="Moon"
            :inactive-icon="Sunny"
            @change="toggleDark"
          />
          <template v-if="userStore.isLoggedIn">
            <el-dropdown @command="handleUserCommand">
              <el-avatar :src="userStore.userInfo?.avatar" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="`user/${userStore.userInfo?.id}`">个人中心</el-dropdown-item>
                  <el-dropdown-item 
                    command="logout" 
                    divided 
                    class="logout-item"
                  >
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="$router.push('/login')">登录</el-button>
            <el-button @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </el-header>
    <el-main class="main-content">
      <router-view />
    </el-main>
    <el-footer class="footer">
      <div class="footer-content">
        <p>© 2024 Minecraft 论坛 | 整合包 / MOD / 资源包 在线编辑发布平台</p>
      </div>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePageTitle } from '@/composables/usePageTitle'
import { Grid, Search, Moon, Sunny, User, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const pageTitle = usePageTitle()

const searchKeyword = ref('')
const isDark = ref(document.documentElement.classList.contains('dark'))

// 获取所有标题列表的计算属性
const titleList = computed(() => {
  return pageTitle.getAllTitles()
})

// 排序标题列表：帖子在前，资源在后
const orderedTitleList = computed(() => {
  const posts = titleList.value.filter(t => t.type === 'post')
  const resources = titleList.value.filter(t => t.type === 'resource')
  return [...posts, ...resources]
})

// 判断标题是否是激活状态（当前正在查看的页面）
const isTitleActive = (title: { type: 'post' | 'resource', id: number, name: string }) => {
  const routeName = route.name as string
  const routeId = parseInt(route.params.id as string)
  
  if (title.type === 'post' && routeName === 'ForumPost' && routeId === title.id) {
    return true
  }
  if (title.type === 'resource' && routeName === 'ResourceDetail' && routeId === title.id) {
    return true
  }
  return false
}

// 点击标题跳转到对应页面
const handleTitleClick = (title: { type: 'post' | 'resource', id: number, name: string }) => {
  const path = pageTitle.getRoutePath(title)
  if (path) {
    router.push(path)
  }
}

// 关闭标题
const handleTitleClose = (title: { type: 'post' | 'resource', id: number, name: string }) => {
  const routeName = route.name as string
  const routeId = parseInt(route.params.id as string)
  
  // 检查当前是否正在查看这个标题对应的页面
  const isCurrentPage = 
    (title.type === 'post' && routeName === 'ForumPost' && routeId === title.id) ||
    (title.type === 'resource' && routeName === 'ResourceDetail' && routeId === title.id)
  
  // 如果当前正在查看这个页面，关闭后跳转到对应的父页面
  if (isCurrentPage) {
    if (title.type === 'post') {
      // 帖子关闭后跳转到论坛页面
      router.push('/forum')
    } else if (title.type === 'resource') {
      // 资源关闭后跳转到首页
      router.push('/home')
    }
  }
  
  // 清除标题
  pageTitle.clearTitleByKey(pageTitle.getTitleKey(title))
}

const activeMenu = computed(() => {
  const name = route.name as string
  // 如果是在查看帖子或资源详情页，不激活论坛菜单
  if (name === 'ForumPost' || name === 'ResourceDetail') {
    return ''
  }
  if (name === 'Home') return 'home'
  if (name === 'Forum') return 'forum'
  if (name === 'Upload') return 'upload'
  if (name === 'Admin') return 'admin'
  return ''
})

const handleMenuSelect = (key: string) => {
  // 如果是动态标题的 key（以 "title-" 开头），不处理，由 handleTitleClick 处理
  if (key.startsWith('title-')) {
    return
  }
  router.push({ name: key.charAt(0).toUpperCase() + key.slice(1) })
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ name: 'Home', query: { keyword: searchKeyword.value } })
  }
}

const handleUserCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/')
  } else {
    router.push(`/${command}`)
  }
}


const toggleDark = (val: boolean) => {
  if (val) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 监听权限变化，如果当前页面需要权限但权限被移除，则跳转
let permissionCheckInProgress = false
watch(() => userStore.permissions, (_newPermissions: string[], oldPermissions: string[] | undefined) => {
  // 避免初始化时触发
  if (!oldPermissions || oldPermissions.length === 0) {
    return
  }
  
  // 避免重复检查
  if (permissionCheckInProgress) {
    return
  }
  
  const currentRoute = route
  if (currentRoute.meta.requiresPermission) {
    const requiredPermission = currentRoute.meta.requiresPermission as string
    if (!userStore.hasPermission(requiredPermission)) {
      permissionCheckInProgress = true
      ElMessage.warning('您的权限已变更，无法继续访问当前页面')
      // 直接跳转到登录页，避免循环重定向
      if (currentRoute.name !== 'Login') {
        router.push({ name: 'Login' }).finally(() => {
          permissionCheckInProgress = false
        })
      } else {
        permissionCheckInProgress = false
      }
    }
  }
}, { deep: true })

// 不再自动清除标题，只有手动点击关闭按钮才清除

onMounted(async () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
  
  // 初始化时加载系统配置
  if (userStore.anonymousAccess === undefined) {
    await userStore.fetchSystemConfig()
  }
})
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.header {
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  padding: 0;
  height: 60px;
}

.header-content {
  display: flex;
  align-items: center;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: bold;
  color: var(--el-color-primary);
  cursor: pointer;
  margin-right: 40px;
}

.header-menu {
  flex: 1;
  border-bottom: none;
}

.dynamic-title-item {
  position: relative;
}

.dynamic-title-item .title-text {
  margin-right: 8px;
}

.dynamic-title-item .close-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  padding: 0;
  margin: 0;
  width: 16px;
  height: 16px;
  font-size: 12px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.dynamic-title-item:hover .close-btn {
  opacity: 1;
}

.dynamic-title-item .close-btn:hover {
  opacity: 1;
  color: var(--el-color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.search-input {
  width: 300px;
}

.user-avatar {
  cursor: pointer;
}

:deep(.logout-item) {
  color: var(--el-color-danger) !important;
}

:deep(.logout-item:hover) {
  color: var(--el-color-danger) !important;
  background-color: var(--el-color-danger-light-9) !important;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
}

.footer {
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color);
  height: 60px;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
}

</style>





