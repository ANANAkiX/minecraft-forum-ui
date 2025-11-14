<template>
  <div class="permission-transfer">
    <div class="transfer-panel left-panel">
      <div class="panel-header">
        <el-checkbox
          v-model="leftCheckedAll"
          :indeterminate="leftIndeterminate"
          @change="handleLeftCheckAllChange"
        >
          可用权限
        </el-checkbox>
        <span class="count">{{ leftCheckedCount }}/{{ leftData.length }}</span>
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
        <div
          v-for="item in leftFilteredData"
          :key="item.key"
          class="transfer-item"
          @click="handleItemClick(item, 'left')"
        >
          <el-checkbox
            :model-value="leftCheckedKeys.includes(item.key)"
            @change="(val) => handleItemCheckChange(item, val, 'left')"
            @click.stop
          >
            <div class="item-content">
              <span class="item-label">{{ item.label }}</span>
              <span class="item-code">{{ item.code }}</span>
            </div>
          </el-checkbox>
        </div>
        <el-empty v-if="leftFilteredData.length === 0" description="无数据" :image-size="80" />
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
        <span class="count">{{ rightCheckedCount }}/{{ rightData.length }}</span>
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
        <div
          v-for="item in rightFilteredData"
          :key="item.key"
          class="transfer-item"
          @click="handleItemClick(item, 'right')"
        >
          <el-checkbox
            :model-value="rightCheckedKeys.includes(item.key)"
            @change="(val) => handleItemCheckChange(item, val, 'right')"
            @click.stop
          >
            <div class="item-content">
              <span class="item-label">{{ item.label }}</span>
              <span class="item-code">{{ item.code }}</span>
            </div>
          </el-checkbox>
        </div>
        <el-empty v-if="rightFilteredData.length === 0" description="无数据" :image-size="80" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

interface TransferItem {
  key: number | string
  label: string
  code: string
  description?: string
}

interface Props {
  modelValue: (number | string)[]
  data: TransferItem[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: (number | string)[]]
}>()

// 左侧数据（未分配的权限）
const leftData = computed(() => {
  const assignedKeys = props.modelValue
  return props.data.filter(item => !assignedKeys.includes(item.key))
})

// 右侧数据（已分配的权限）
const rightData = computed(() => {
  const assignedKeys = props.modelValue
  return props.data.filter(item => assignedKeys.includes(item.key))
})

// 左侧选中项
const leftCheckedKeys = ref<(number | string)[]>([])
// 右侧选中项
const rightCheckedKeys = ref<(number | string)[]>([])

// 左侧搜索文本
const leftFilterText = ref('')
// 右侧搜索文本
const rightFilterText = ref('')

// 左侧过滤后的数据
const leftFilteredData = computed(() => {
  if (!leftFilterText.value) {
    return leftData.value
  }
  const query = leftFilterText.value.toLowerCase()
  return leftData.value.filter(item =>
    item.label.toLowerCase().includes(query) ||
    item.code.toLowerCase().includes(query) ||
    (item.description && item.description.toLowerCase().includes(query))
  )
})

// 右侧过滤后的数据
const rightFilteredData = computed(() => {
  if (!rightFilterText.value) {
    return rightData.value
  }
  const query = rightFilterText.value.toLowerCase()
  return rightData.value.filter(item =>
    item.label.toLowerCase().includes(query) ||
    item.code.toLowerCase().includes(query) ||
    (item.description && item.description.toLowerCase().includes(query))
  )
})

// 左侧全选状态
const leftCheckedAll = computed({
  get: () => {
    if (leftFilteredData.value.length === 0) return false
    return leftFilteredData.value.every(item => leftCheckedKeys.value.includes(item.key))
  },
  set: (val: boolean) => {
    if (val) {
      leftCheckedKeys.value = leftFilteredData.value.map(item => item.key)
    } else {
      leftCheckedKeys.value = []
    }
  }
})

// 左侧半选状态
const leftIndeterminate = computed(() => {
  const checkedCount = leftFilteredData.value.filter(item => leftCheckedKeys.value.includes(item.key)).length
  return checkedCount > 0 && checkedCount < leftFilteredData.value.length
})

// 右侧全选状态
const rightCheckedAll = computed({
  get: () => {
    if (rightFilteredData.value.length === 0) return false
    return rightFilteredData.value.every(item => rightCheckedKeys.value.includes(item.key))
  },
  set: (val: boolean) => {
    if (val) {
      rightCheckedKeys.value = rightFilteredData.value.map(item => item.key)
    } else {
      rightCheckedKeys.value = []
    }
  }
})

// 右侧半选状态
const rightIndeterminate = computed(() => {
  const checkedCount = rightFilteredData.value.filter(item => rightCheckedKeys.value.includes(item.key)).length
  return checkedCount > 0 && checkedCount < rightFilteredData.value.length
})

// 左侧选中数量
const leftCheckedCount = computed(() => leftCheckedKeys.value.length)
// 右侧选中数量
const rightCheckedCount = computed(() => rightCheckedKeys.value.length)

// 左侧全选变化
const handleLeftCheckAllChange = (val: boolean) => {
  leftCheckedAll.value = val
}

// 右侧全选变化
const handleRightCheckAllChange = (val: boolean) => {
  rightCheckedAll.value = val
}

// 单项点击
const handleItemClick = (item: TransferItem, side: 'left' | 'right') => {
  const checkedKeys = side === 'left' ? leftCheckedKeys : rightCheckedKeys
  const index = checkedKeys.value.indexOf(item.key)
  if (index > -1) {
    checkedKeys.value.splice(index, 1)
  } else {
    checkedKeys.value.push(item.key)
  }
}

// 单项复选框变化
const handleItemCheckChange = (item: TransferItem, val: boolean, side: 'left' | 'right') => {
  const checkedKeys = side === 'left' ? leftCheckedKeys : rightCheckedKeys
  if (val) {
    if (!checkedKeys.value.includes(item.key)) {
      checkedKeys.value.push(item.key)
    }
  } else {
    const index = checkedKeys.value.indexOf(item.key)
    if (index > -1) {
      checkedKeys.value.splice(index, 1)
    }
  }
}

// 添加到右侧
const handleAdd = () => {
  const newValue = [...props.modelValue, ...leftCheckedKeys.value]
  emit('update:modelValue', newValue)
  leftCheckedKeys.value = []
}

// 从右侧移除
const handleRemove = () => {
  const newValue = props.modelValue.filter(key => !rightCheckedKeys.value.includes(key))
  emit('update:modelValue', newValue)
  rightCheckedKeys.value = []
}

// 监听 modelValue 变化，清空选中项
watch(() => props.modelValue, () => {
  leftCheckedKeys.value = []
  rightCheckedKeys.value = []
})
</script>

<style scoped>
.permission-transfer {
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
  padding: 8px 0;
  min-height: 0;
  height: 0;
}

.transfer-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
}

.transfer-item:hover {
  background-color: var(--el-fill-color-light);
}

.transfer-item :deep(.el-checkbox) {
  width: 100%;
  margin-right: 0;
}

.transfer-item :deep(.el-checkbox__label) {
  width: 100%;
  padding-left: 12px;
  display: flex;
  align-items: center;
  line-height: 20px;
}

.item-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
  line-height: 20px;
}

.item-label {
  font-weight: 500;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: visible;
}

.item-code {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  white-space: nowrap;
  overflow: visible;
}

.transfer-buttons {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  flex-shrink: 0;
  flex: 0 0 auto;
  align-self: center;
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
</style>

