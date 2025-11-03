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
          <el-menu-item index="home">首页</el-menu-item>
          <el-menu-item index="forum">论坛</el-menu-item>
          <el-menu-item index="upload" v-if="userStore.isLoggedIn">上传资源</el-menu-item>
          <el-menu-item index="admin" v-if="userStore.isAdmin">后台管理</el-menu-item>
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
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Grid, Search, Moon, Sunny, User } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const searchKeyword = ref('')
const isDark = ref(document.documentElement.classList.contains('dark'))

const activeMenu = computed(() => {
  const name = route.name as string
  if (name === 'Home') return 'home'
  if (name?.includes('Forum')) return 'forum'
  if (name === 'Upload') return 'upload'
  if (name === 'Admin') return 'admin'
  return ''
})

const handleMenuSelect = (key: string) => {
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

onMounted(() => {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
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

