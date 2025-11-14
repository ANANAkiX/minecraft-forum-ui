
import { ref } from 'vue'

type TitleType = 'post' | 'resource'

interface PageTitle {
    type: TitleType
    name: string
    id: number // 保存帖子或资源的ID，用于跳转
}

// 使用 Map 来存储多个标题，key 为 type-id
const titles = ref<Map<string, PageTitle>>(new Map())

/**
 * 页面标题管理 Composable
 * 用于管理当前查看的帖子或资源的标题显示
 * 支持同时显示多个标题（帖子和资源）
 */
export function usePageTitle() {
    /**
     * 生成标题的唯一 key
     */
    const getTitleKey = (type: TitleType, id: number) => {
        return `${type}-${id}`
    }

    /**
     * 设置帖子标题
     * 如果已有帖子标题，会替换旧的
     */
    const setPostTitle = (postName: string, postId: number) => {
        // 先清除所有旧的帖子标题
        const keysToDelete: string[] = []
        titles.value.forEach((title, key) => {
            if (title.type === 'post') {
                keysToDelete.push(key)
            }
        })
        keysToDelete.forEach(key => titles.value.delete(key))

        // 设置新的帖子标题
        const key = getTitleKey('post', postId)
        titles.value.set(key, {
            type: 'post',
            name: postName,
            id: postId
        })
    }

    /**
     * 设置资源标题
     * 如果已有资源标题，会替换旧的
     */
    const setResourceTitle = (resourceName: string, resourceId: number) => {
        // 先清除所有旧的资源标题
        const keysToDelete: string[] = []
        titles.value.forEach((title, key) => {
            if (title.type === 'resource') {
                keysToDelete.push(key)
            }
        })
        keysToDelete.forEach(key => titles.value.delete(key))

        // 设置新的资源标题
        const key = getTitleKey('resource', resourceId)
        titles.value.set(key, {
            type: 'resource',
            name: resourceName,
            id: resourceId
        })
    }

    /**
     * 清除指定类型的标题
     */
    const clearTitle = (type?: TitleType, id?: number) => {
        if (type && id !== undefined) {
            // 清除指定类型和ID的标题
            const key = getTitleKey(type, id)
            titles.value.delete(key)
        } else if (type) {
            // 清除指定类型的所有标题
            const keysToDelete: string[] = []
            titles.value.forEach((title, key) => {
                if (title.type === type) {
                    keysToDelete.push(key)
                }
            })
            keysToDelete.forEach(key => titles.value.delete(key))
        } else {
            // 清除所有标题
            titles.value.clear()
        }
    }

    /**
     * 清除指定标题（通过 key）
     */
    const clearTitleByKey = (key: string) => {
        titles.value.delete(key)
    }

    /**
     * 获取所有标题列表
     */
    const getAllTitles = () => {
        return Array.from(titles.value.values())
    }

    /**
     * 获取格式化的标题文本
     */
    const getFormattedTitle = (title: PageTitle) => {
        const prefix = title.type === 'post' ? '帖子' : '资源'
        return `${prefix}-${title.name}`
    }

    /**
     * 获取跳转路径
     */
    const getRoutePath = (title: PageTitle) => {
        if (title.type === 'post') {
            return `/forum/post/${title.id}`
        } else if (title.type === 'resource') {
            return `/resource/${title.id}`
        }
        return ''
    }

    /**
     * 获取标题的 key（用于外部调用）
     */
    const getTitleKeyForTitle = (title: PageTitle) => {
        return getTitleKey(title.type, title.id)
    }

    return {
        titles,
        setPostTitle,
        setResourceTitle,
        clearTitle,
        clearTitleByKey,
        getAllTitles,
        getFormattedTitle,
        getRoutePath,
        getTitleKey: getTitleKeyForTitle
    }
}

