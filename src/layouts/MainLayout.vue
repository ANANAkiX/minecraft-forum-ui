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
          <div class="search-wrapper">
            <div class="search-input-container">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索帖子和资源..."
                class="search-input"
                @input="handleSearchInput"
                @keyup.enter="handleSearch"
                @focus="handleSearchFocus"
                @blur="handleSearchBlur"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
                    <!-- 自定义下拉建议列表 -->
                    <div
                      v-if="showSuggestions && searchKeyword.trim().length >= 2"
                      class="search-suggestions"
                      @mousedown.prevent
                    >
                      <!-- 加载中状态 -->
                      <div v-if="searchLoading" class="search-loading">
                        <el-icon class="is-loading"><Loading /></el-icon>
                        <span style="margin-left: 8px;">搜索中...</span>
                      </div>
                      <!-- 有搜索结果 -->
                      <template v-else-if="searchResults.length > 0">
                        <div
                          v-for="(result, index) in searchResults"
                          :key="`${result.type}-${result.id}`"
                          class="suggestion-item"
                          :class="{ 'is-active': selectedIndex === index }"
                          @click="handleSelectResult(result)"
                          @mouseenter="selectedIndex = index"
                          v-html="formatSuggestion(result)"
                        ></div>
                      </template>
                      <!-- 无搜索结果 -->
                      <div v-else class="search-empty">
                        <el-icon><DocumentRemove /></el-icon>
                        <span style="margin-left: 8px;">暂无数据</span>
                      </div>
                    </div>
            </div>
          </div>
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
import { Grid, Search, Moon, Sunny, User, Close, Loading, DocumentRemove } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { searchApi, type SearchResult } from '@/api/search'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const pageTitle = usePageTitle()

const searchKeyword = ref('')
const isDark = ref(document.documentElement.classList.contains('dark'))
const searchLoading = ref(false)
const searchResults = ref<SearchResult[]>([])
const showSuggestions = ref(false)
const selectedIndex = ref(-1)
let searchTimer: ReturnType<typeof setTimeout> | null = null

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

// 格式化建议项显示
const formatSuggestion = (result: SearchResult): string => {
  const title = result.title || ''
  
  // 获取高亮内容，优先使用 highlights，如果没有则使用 summary
  let highlightContent = ''
  if (result.highlights && result.highlights.length > 0) {
    // 取第一个高亮内容，如果太长则截取
    highlightContent = result.highlights[0]
    if (highlightContent.length > 100) {
      highlightContent = highlightContent.substring(0, 100) + '...'
    }
  } else if (result.summary) {
    highlightContent = result.summary
    if (highlightContent.length > 100) {
      highlightContent = highlightContent.substring(0, 100) + '...'
    }
  }
  
  return `<div class="suggestion-content">
    <div class="suggestion-title">${title}</div>
    ${highlightContent ? `<div class="suggestion-highlight">${highlightContent}</div>` : ''}
    <div class="suggestion-author">${result.authorName || '未知作者'}</div>
  </div>`
}

// 输入处理（防抖）
const handleSearchInput = () => {
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  const keyword = searchKeyword.value?.trim() || ''
  
  // 如果关键词太短，清空结果并隐藏搜索框
  if (keyword.length < 2) {
    searchResults.value = []
    showSuggestions.value = false
    searchLoading.value = false
    return
  }
  
  // 立即显示搜索框（即使还在加载）
  showSuggestions.value = true
  
  // 延迟搜索，避免频繁请求
  searchTimer = setTimeout(async () => {
    await performSearch()
  }, 300)
}

// 搜索框获得焦点
const handleSearchFocus = () => {
  // 如果有搜索关键词且长度>=2，显示搜索框
  if (searchKeyword.value && searchKeyword.value.trim().length >= 2) {
    showSuggestions.value = true
  }
}

// 执行搜索
const performSearch = async () => {
  const keyword = searchKeyword.value?.trim() || ''
  
  if (keyword.length < 2) {
    searchResults.value = []
    showSuggestions.value = false
    searchLoading.value = false
    return
  }
  
  // 如果用户已登录但用户信息还未加载，先加载用户信息
  if (userStore.isLoggedIn && !userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      // 如果获取用户信息失败，说明Token无效，清除token
      console.warn('获取用户信息失败，Token可能已失效:', error)
      userStore.logout()
      searchResults.value = []
      showSuggestions.value = false
      searchLoading.value = false
      return
    }
  }
  
  // 检查权限
  if (!userStore.hasPermission('elasticsearch:search')) {
    ElMessage.warning('您没有搜索权限')
    searchResults.value = []
    showSuggestions.value = false
    searchLoading.value = false
    return
  }
  
  // 显示加载状态
  searchLoading.value = true
  showSuggestions.value = true
  
  try {
    const results = await searchApi.search({
      keyword: keyword,
      page: 1,
      pageSize: 10
    })
    
    // 设置搜索结果
    searchResults.value = results || []
    selectedIndex.value = -1
    
    // 确保搜索框显示（包括空结果）
    showSuggestions.value = true
  } catch (error: any) {
    console.error('搜索失败:', error)
    const errorMessage = error?.response?.data?.message || error?.message || '搜索失败，请稍后重试'
    
    if (error?.response?.status === 403) {
      // 权限错误已经在权限检查时提示了
      searchResults.value = []
      showSuggestions.value = false
    } else if (error?.response?.status === 500) {
      // 服务器错误，可能是 Elasticsearch 连接失败
      console.error('Elasticsearch 可能未启动或连接失败:', errorMessage)
      ElMessage.warning('搜索服务暂时不可用，请检查 Elasticsearch 服务')
      searchResults.value = []
      showSuggestions.value = false
    } else {
      ElMessage.error(errorMessage)
      searchResults.value = []
      showSuggestions.value = false
    }
  } finally {
    // 搜索完成，关闭加载状态
    searchLoading.value = false
  }
}

// 选择搜索结果
const handleSelectResult = (result: SearchResult) => {
  if (result.type === 'POST') {
    router.push({ name: 'ForumPost', params: { id: result.id } })
  } else if (result.type === 'RESOURCE') {
    router.push({ name: 'ResourceDetail', params: { id: result.id } })
  }
  searchKeyword.value = ''
  searchResults.value = []
  showSuggestions.value = false
  selectedIndex.value = -1
}

// 搜索框失去焦点处理
const handleSearchBlur = () => {
  // 延迟隐藏，允许点击建议项
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

// 回车搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    // 如果有搜索结果，跳转到第一个结果或选中的结果
    if (searchResults.value.length > 0) {
      const result = selectedIndex.value >= 0 
        ? searchResults.value[selectedIndex.value]
        : searchResults.value[0]
      handleSelectResult(result)
    } else {
      // 如果没有搜索结果，使用原来的搜索方式
      router.push({ name: 'Home', query: { keyword: searchKeyword.value } })
      searchKeyword.value = ''
    }
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
  isDark.value = val
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

.search-wrapper {
  position: relative;
}

.search-input-container {
  position: relative;
  width: 225px;
}

.search-input {
  width: 100%;
}

/* 防止输入框在输入法输入时闪烁 */
:deep(.search-input .el-input__wrapper),
:deep(.search-input .el-input__wrapper:hover),
:deep(.search-input .el-input__wrapper.is-focus),
:deep(.search-input .el-input__wrapper.is-disabled) {
  transition: none !important;
  animation: none !important;
  transform: none !important;
  will-change: auto !important;
}

:deep(.search-input .el-input__inner),
:deep(.search-input .el-input__inner:hover),
:deep(.search-input .el-input__inner:focus) {
  transition: none !important;
  animation: none !important;
  transform: none !important;
  will-change: auto !important;
}

:deep(.search-input .el-input__prefix),
:deep(.search-input .el-input__suffix) {
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

:deep(.search-input .el-input__clear) {
  transition: none !important;
  animation: none !important;
}

/* 自定义下拉建议列表 */
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light);
  z-index: 2000;
  max-height: 400px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.is-active {
  background-color: var(--el-fill-color-light);
}

/* 建议项内容样式 */
.suggestion-content {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  max-width: 100%;
}

.suggestion-highlight {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  overflow-wrap: break-word;
}

/* 高亮关键词样式 - 通过 class 选择器统一设置样式（类似首页菜单激活颜色：绿色 #52c41a） */
/* 使用 :deep() 确保样式能应用到 v-html 渲染的内容 */
/* 只设置文字颜色，不设置背景色 */
:deep(.suggestion-highlight .search-highlight),
:deep(.suggestion-content .search-highlight),
:deep(.suggestion-title .search-highlight) {
  background-color: transparent;
  color: #52c41a;
  font-weight: normal;
}

/* 夜间模式适配 - 高亮关键词 */
html.dark :deep(.suggestion-highlight .search-highlight),
html.dark :deep(.suggestion-content .search-highlight),
html.dark :deep(.suggestion-title .search-highlight) {
  background-color: transparent;
  color: #95de64;
}

/* 夜间模式适配 - 搜索下拉框和搜索项 */
html.dark .search-suggestions {
  background: var(--el-bg-color);
  border-color: var(--el-border-color-light);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
}

html.dark .suggestion-item {
  border-bottom-color: var(--el-border-color-lighter);
}

html.dark .suggestion-item:hover,
html.dark .suggestion-item.is-active {
  background-color: rgba(255, 255, 255, 0.08);
}

.suggestion-author {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

/* 标题中的高亮关键词样式 - 由后端根据 isDark 参数动态设置内联样式，无需前端覆盖 */

/* 搜索加载和空状态 */
.search-loading,
.search-empty {
  padding: 20px;
  text-align: center;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.search-empty {
  color: var(--el-text-color-placeholder);
}

.search-empty .el-icon {
  font-size: 18px;
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





