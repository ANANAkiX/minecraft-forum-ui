<template>
  <div class="permission-tree-transfer">
    <div class="transfer-panel left-panel">
      <div class="panel-header">
        <el-checkbox
          v-model="leftCheckedAll"
          :indeterminate="leftIndeterminate"
          @change="handleLeftCheckAllChange"
        >
          可用权限
        </el-checkbox>
        <span class="count">{{ leftCheckedCount }}/{{ leftTotalCount }}</span>
      </div>
      <div class="panel-search">
        <el-input
          v-model="leftFilterText"
          placeholder="搜索权限"
          clearable
          :prefix-icon="Search"
        />
      </div>
      <div class="panel-body">
        <el-tree
          ref="leftTreeRef"
          :data="leftFilteredTree"
          :props="treeProps"
          show-checkbox
          node-key="id"
          :default-expand-all="false"
          :default-expanded-keys="leftExpandedKeys"
          :filter-node-method="filterNode"
          @check="handleLeftTreeCheck"
          @node-expand="handleLeftNodeExpand"
          @node-collapse="handleLeftNodeCollapse"
        >
          <template #default="{ node, data }">
            <div class="tree-node-content">
              <span class="node-label">{{ data.name }}</span>
              <span class="node-code">{{ data.code }}</span>
              <el-tag
                v-if="data.type"
                :type="data.type === 'PAGE' ? 'success' : 'info'"
                size="small"
                style="margin-left: 8px;"
              >
                {{ data.type === 'PAGE' ? '页面' : '操作' }}
              </el-tag>
            </div>
          </template>
        </el-tree>
        <el-empty v-if="leftFilteredTree.length === 0" description="无数据" :image-size="80" />
      </div>
    </div>

    <div class="transfer-buttons">
      <el-button
        type="primary"
        :disabled="rightCheckedKeys.length === 0"
        @click="handleRemove"
      >
        <el-icon><ArrowLeft /></el-icon>
        <span>移除</span>
      </el-button>
      <el-button
        type="primary"
        :disabled="leftCheckedKeys.length === 0"
        @click="handleAdd"
      >
        <span>添加</span>
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>

    <div class="transfer-panel right-panel">
      <div class="panel-header">
        <el-checkbox
          v-model="rightCheckedAll"
          :indeterminate="rightIndeterminate"
          @change="handleRightCheckAllChange"
        >
          已分配权限
        </el-checkbox>
        <span class="count">{{ rightCheckedCount }}/{{ rightTotalCount }}</span>
      </div>
      <div class="panel-search">
        <el-input
          v-model="rightFilterText"
          placeholder="搜索权限"
          clearable
          :prefix-icon="Search"
        />
      </div>
      <div class="panel-body">
        <el-tree
          ref="rightTreeRef"
          :data="rightFilteredTree"
          :props="treeProps"
          show-checkbox
          node-key="id"
          :default-expand-all="false"
          :default-expanded-keys="rightExpandedKeys"
          :filter-node-method="filterNode"
          @check="handleRightTreeCheck"
          @node-expand="handleRightNodeExpand"
          @node-collapse="handleRightNodeCollapse"
        >
          <template #default="{ node, data }">
            <div class="tree-node-content">
              <span class="node-label">{{ data.name }}</span>
              <span class="node-code">{{ data.code }}</span>
              <el-tag
                v-if="data.type"
                :type="data.type === 'PAGE' ? 'success' : 'info'"
                size="small"
                style="margin-left: 8px;"
              >
                {{ data.type === 'PAGE' ? '页面' : '操作' }}
              </el-tag>
            </div>
          </template>
        </el-tree>
        <el-empty v-if="rightFilteredTree.length === 0" description="无数据" :image-size="80" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Search, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import type { PermissionTreeNode } from '@/api/admin'
import type { ElTree } from 'element-plus'

interface Props {
  modelValue: number[]
  data: PermissionTreeNode[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const treeProps = {
  children: 'children',
  label: 'name'
}

const leftTreeRef = ref<InstanceType<typeof ElTree>>()
const rightTreeRef = ref<InstanceType<typeof ElTree>>()

const leftFilterText = ref('')
const rightFilterText = ref('')

// 左侧选中项
const leftCheckedKeys = ref<number[]>([])
// 右侧选中项
const leftHalfCheckedKeys = ref<number[]>([])
const rightCheckedKeys = ref<number[]>([])
const rightHalfCheckedKeys = ref<number[]>([])

// 保存展开的节点ID
const leftExpandedKeys = ref<number[]>([])
const rightExpandedKeys = ref<number[]>([])

// 将树形数据扁平化，用于查找
const flattenTree = (tree: PermissionTreeNode[]): PermissionTreeNode[] => {
  const result: PermissionTreeNode[] = []
  const traverse = (nodes: PermissionTreeNode[]) => {
    for (const node of nodes) {
      result.push(node)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    }
  }
  traverse(tree)
  return result
}

// 根据已分配的权限ID，构建已分配的树
const buildAssignedTree = (allTree: PermissionTreeNode[], assignedIds: number[]): PermissionTreeNode[] => {
  const assignedSet = new Set(assignedIds)
  
  const filterTree = (nodes: PermissionTreeNode[]): PermissionTreeNode[] => {
    return nodes
      .map(node => {
        const hasAssignedChild = node.children && node.children.some(child => assignedSet.has(child.id))
        const isAssigned = assignedSet.has(node.id)
        
        if (isAssigned || hasAssignedChild) {
          const newNode = { ...node }
          if (node.children && node.children.length > 0) {
            newNode.children = filterTree(node.children)
          }
          return newNode
        }
        return null
      })
      .filter((node): node is PermissionTreeNode => node !== null)
  }
  
  return filterTree(allTree)
}

// 根据已分配的权限ID，构建未分配的树
// 规则：只有当父权限下的所有子权限都被分配后，父权限才不显示
// 如果父权限被分配但还有未分配的子权限，父权限仍然显示（保持树结构）
const buildUnassignedTree = (allTree: PermissionTreeNode[], assignedIds: number[]): PermissionTreeNode[] => {
  const assignedSet = new Set(assignedIds)
  
  // 检查节点下是否有未分配的子节点
  const hasUnassignedChildren = (node: PermissionTreeNode): boolean => {
    if (!node.children || node.children.length === 0) {
      return false
    }
    return node.children.some(child => {
      const childAssigned = assignedSet.has(child.id)
      // 如果子节点未分配，或者子节点被分配但还有未分配的子节点
      return !childAssigned || hasUnassignedChildren(child)
    })
  }
  
  const filterTree = (nodes: PermissionTreeNode[]): PermissionTreeNode[] => {
    return nodes
      .map(node => {
        const isAssigned = assignedSet.has(node.id)
        const hasUnassigned = hasUnassignedChildren(node)
        
        // 如果节点被分配，但还有未分配的子节点，仍然显示该节点（保持树结构）
        if (isAssigned && hasUnassigned) {
          const newNode = { ...node }
          if (node.children && node.children.length > 0) {
            newNode.children = filterTree(node.children)
          }
          return newNode
        }
        
        // 如果节点被分配，且所有子节点都被分配，则不显示该节点
        if (isAssigned && !hasUnassigned) {
          return null
        }
        
        // 节点未被分配，保留节点并递归处理子节点
        const newNode = { ...node }
        if (node.children && node.children.length > 0) {
          newNode.children = filterTree(node.children)
          // 如果所有子节点都被过滤掉，仍然保留当前节点（叶子节点）
          if (!newNode.children || newNode.children.length === 0) {
            newNode.children = []
          }
        }
        return newNode
      })
      .filter((node): node is PermissionTreeNode => node !== null)
  }
  
  return filterTree(allTree)
}

// 左侧树（未分配的权限）
const leftTree = computed(() => {
  return buildUnassignedTree(props.data, props.modelValue)
})

// 右侧树（已分配的权限）
const rightTree = computed(() => {
  return buildAssignedTree(props.data, props.modelValue)
})

// 左侧过滤后的树
const leftFilteredTree = computed(() => {
  if (!leftFilterText.value) {
    return leftTree.value
  }
  // 这里需要实现树形过滤，暂时返回原树
  return leftTree.value
})

// 右侧过滤后的树
const rightFilteredTree = computed(() => {
  if (!rightFilterText.value) {
    return rightTree.value
  }
  return rightTree.value
})

// 左侧总数量
const leftTotalCount = computed(() => {
  return flattenTree(leftTree.value).length
})

// 右侧总数量
const rightTotalCount = computed(() => {
  return flattenTree(rightTree.value).length
})

// 左侧选中数量
const leftCheckedCount = computed(() => leftCheckedKeys.value.length)
// 右侧选中数量
const rightCheckedCount = computed(() => rightCheckedKeys.value.length)

// 左侧全选状态
const leftCheckedAll = computed({
  get: () => {
    const total = leftTotalCount.value
    if (total === 0) return false
    return leftCheckedCount.value === total
  },
  set: (val: boolean) => {
    if (val) {
      leftTreeRef.value?.setCheckedKeys(flattenTree(leftTree.value).map(n => n.id))
    } else {
      leftTreeRef.value?.setCheckedKeys([])
    }
  }
})

// 左侧半选状态
const leftIndeterminate = computed(() => {
  const total = leftTotalCount.value
  const checked = leftCheckedCount.value
  return checked > 0 && checked < total
})

// 右侧全选状态
const rightCheckedAll = computed({
  get: () => {
    const total = rightTotalCount.value
    if (total === 0) return false
    return rightCheckedCount.value === total
  },
  set: (val: boolean) => {
    if (val) {
      rightTreeRef.value?.setCheckedKeys(flattenTree(rightTree.value).map(n => n.id))
    } else {
      rightTreeRef.value?.setCheckedKeys([])
    }
  }
})

// 右侧半选状态
const rightIndeterminate = computed(() => {
  const total = rightTotalCount.value
  const checked = rightCheckedCount.value
  return checked > 0 && checked < total
})

// 过滤节点
const filterNode = (value: string, data: PermissionTreeNode) => {
  if (!value) return true
  const query = value.toLowerCase()
  return (
    data.name.toLowerCase().includes(query) ||
    data.code.toLowerCase().includes(query) ||
    (data.description && data.description.toLowerCase().includes(query))
  )
}

// 左侧树选中变化
const handleLeftTreeCheck = (data: PermissionTreeNode, checked: { checkedKeys: number[], halfCheckedKeys: number[] }) => {
  leftCheckedKeys.value = checked.checkedKeys
  leftHalfCheckedKeys.value = checked.halfCheckedKeys
}

// 右侧树选中变化
const handleRightTreeCheck = (data: PermissionTreeNode, checked: { checkedKeys: number[], halfCheckedKeys: number[] }) => {
  rightCheckedKeys.value = checked.checkedKeys
  rightHalfCheckedKeys.value = checked.halfCheckedKeys
}

// 左侧树节点展开
const handleLeftNodeExpand = (data: PermissionTreeNode) => {
  if (!leftExpandedKeys.value.includes(data.id)) {
    leftExpandedKeys.value.push(data.id)
  }
}

// 左侧树节点收起
const handleLeftNodeCollapse = (data: PermissionTreeNode) => {
  const index = leftExpandedKeys.value.indexOf(data.id)
  if (index > -1) {
    leftExpandedKeys.value.splice(index, 1)
  }
}

// 右侧树节点展开
const handleRightNodeExpand = (data: PermissionTreeNode) => {
  if (!rightExpandedKeys.value.includes(data.id)) {
    rightExpandedKeys.value.push(data.id)
  }
}

// 右侧树节点收起
const handleRightNodeCollapse = (data: PermissionTreeNode) => {
  const index = rightExpandedKeys.value.indexOf(data.id)
  if (index > -1) {
    rightExpandedKeys.value.splice(index, 1)
  }
}

// 左侧全选变化
const handleLeftCheckAllChange = (val: boolean) => {
  leftCheckedAll.value = val
}

// 右侧全选变化
const handleRightCheckAllChange = (val: boolean) => {
  rightCheckedAll.value = val
}

// 清理不存在的展开节点ID
const cleanExpandedKeys = (expandedKeys: number[], tree: PermissionTreeNode[]): number[] => {
  const allNodeIds = new Set<number>()
  const traverse = (nodes: PermissionTreeNode[]) => {
    for (const node of nodes) {
      allNodeIds.add(node.id)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    }
  }
  traverse(tree)
  return expandedKeys.filter(id => allNodeIds.has(id))
}

// 添加到右侧
const handleAdd = () => {
  const newValue = [...props.modelValue, ...leftCheckedKeys.value]
  emit('update:modelValue', newValue)
  leftCheckedKeys.value = []
  leftHalfCheckedKeys.value = []
  // 保持展开状态，不重置
  nextTick(() => {
    leftTreeRef.value?.setCheckedKeys([])
    // 清理并恢复展开状态
    leftExpandedKeys.value = cleanExpandedKeys(leftExpandedKeys.value, leftTree.value)
    if (leftExpandedKeys.value.length > 0) {
      leftTreeRef.value?.setExpandedKeys(leftExpandedKeys.value)
    }
  })
}

// 从右侧移除
const handleRemove = () => {
  const newValue = props.modelValue.filter(id => !rightCheckedKeys.value.includes(id))
  emit('update:modelValue', newValue)
  rightCheckedKeys.value = []
  rightHalfCheckedKeys.value = []
  // 保持展开状态，不重置
  nextTick(() => {
    rightTreeRef.value?.setCheckedKeys([])
    // 清理并恢复展开状态
    rightExpandedKeys.value = cleanExpandedKeys(rightExpandedKeys.value, rightTree.value)
    if (rightExpandedKeys.value.length > 0) {
      rightTreeRef.value?.setExpandedKeys(rightExpandedKeys.value)
    }
  })
}

// 监听过滤文本变化
watch(leftFilterText, (val) => {
  leftTreeRef.value?.filter(val)
})

watch(rightFilterText, (val) => {
  rightTreeRef.value?.filter(val)
})

// 监听 modelValue 变化，清空选中项，但保持展开状态
watch(() => props.modelValue, () => {
  leftCheckedKeys.value = []
  leftHalfCheckedKeys.value = []
  rightCheckedKeys.value = []
  rightHalfCheckedKeys.value = []
  nextTick(() => {
    leftTreeRef.value?.setCheckedKeys([])
    rightTreeRef.value?.setCheckedKeys([])
    // 清理并恢复展开状态
    leftExpandedKeys.value = cleanExpandedKeys(leftExpandedKeys.value, leftTree.value)
    rightExpandedKeys.value = cleanExpandedKeys(rightExpandedKeys.value, rightTree.value)
    if (leftExpandedKeys.value.length > 0) {
      leftTreeRef.value?.setExpandedKeys(leftExpandedKeys.value)
    }
    if (rightExpandedKeys.value.length > 0) {
      rightTreeRef.value?.setExpandedKeys(rightExpandedKeys.value)
    }
  })
})
</script>

<style scoped>
.permission-tree-transfer {
  display: flex;
  align-items: stretch;
  width: 100%;
  gap: 20px;
  height: 500px;
}

.transfer-panel {
  flex: 0 0 35%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
  min-width: 0;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-page);
}

.panel-header .count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.panel-search {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  min-height: 0;
  height: 0;
}

.tree-node-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  flex: 1;
}

.node-label {
  font-weight: 500;
  flex: 1;
  min-width: 0;
}

.node-code {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.transfer-buttons {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  flex-shrink: 0;
  flex: 0 0 auto;
}

.transfer-buttons .el-button {
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transfer-buttons .el-button span {
  margin: 0 4px;
}

:deep(.el-tree-node__content) {
  height: 32px;
}

:deep(.el-tree-node__label) {
  width: 100%;
}
</style>

