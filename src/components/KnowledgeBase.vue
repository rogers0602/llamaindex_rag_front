<!--
  知识库管理组件

  提供文档上传、管理、删除等功能界面
  支持文件类型识别、权限控制、批量操作等特性

  @author Guo Lijian
  @version 1.0.0
  @since 2025-12-06
-->
<template>
  <div class="h-full p-8 overflow-y-auto">
    <div class="max-w-5xl mx-auto">
      <!-- 头部区域 -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">知识库管理</h2>
          <p class="text-slate-500 text-sm mt-1">
            当前身份: <span class="font-medium text-slate-700">{{ user.role === 'admin' ? '管理员' : '普通成员' }}</span>
            <span class="mx-2 text-slate-300">|</span>
            上传范围: 
            <span :class="['font-medium', user.role === 'admin' ? 'text-purple-600' : 'text-blue-600']">
              {{ user.role === 'admin' ? '全员可见 (Global)' : '仅部门可见' }}
            </span>
          </p>
        </div>

        <div class="flex items-center gap-4">
          <!-- 隐藏的文件输入框 -->
          <input type="file" ref="fileInput" class="hidden" accept=".pdf,.txt,.md,.docx,.xlsx,.pptx,.csv,.key,.numbers,.pages" @change="onFileChange" />

          <!-- 上传按钮：根据角色写死样式和文案 -->
          <button @click="triggerUpload" :disabled="isUploading" :class="[
            'flex items-center gap-2 text-white px-4 py-2 rounded-lg shadow disabled:opacity-50 transition',
            user.role === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
          ]">
            <Upload class="w-4 h-4" />
            {{ isUploading ? '上传中...' : (user.role === 'admin' ? '上传公共文档' : '上传部门文档') }}
          </button>
        </div>
      </div>

      <!-- 列表区域 -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">

        <!-- 加载中 -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center h-[300px] text-slate-500 gap-3">
          <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p class="text-sm font-medium">正在同步文档数据...</p>
        </div>

        <!-- 空数据 -->
        <div v-else-if="docs.length === 0" class="flex flex-col items-center justify-center h-[300px] text-slate-400">
          <Database class="w-16 h-16 mb-4 opacity-20" />
          <p>暂无文档</p>
        </div>

        <!-- 数据表格 -->
        <table v-else class="w-full text-left">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="p-4 text-sm font-semibold text-slate-600 w-1/2">文档名称</th>
              <th class="p-4 text-sm font-semibold text-slate-600 w-1/6">大小</th>
              <!-- 管理员列出所属部门，如果是 Member 则不显示这列 (或者显示上传者) -->
              <th v-if="user.role === 'admin'" class="p-4 text-sm font-semibold text-slate-600 w-1/6">所属空间</th>
              <th class="p-4 text-sm font-semibold text-slate-600 w-1/6">日期</th>
              <th class="p-4 text-sm font-semibold text-slate-600 w-1/6 text-right whitespace-nowrap min-w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in docs" :key="doc.id" class="border-b last:border-0 hover:bg-slate-50 transition">
              
              <!-- 1. 文档名称列 -->
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div :class="[
                    'p-2 rounded-lg shrink-0 flex items-center justify-center transition-colors',
                    getFileConfig(doc.name).bg
                  ]">
                    <component 
                      :is="getFileConfig(doc.name).icon" 
                      :class="['w-5 h-5', getFileConfig(doc.name).color]" 
                    />
                  </div>

                  <div class="flex flex-col overflow-hidden">
                    <span class="font-medium text-slate-700 flex items-center gap-2 truncate" :title="doc.name">
                      {{ doc.name }}
                      <span v-if="doc.isGlobal"
                        class="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 border border-purple-200 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                        <Globe class="w-2.5 h-2.5" /> Global
                      </span>
                    </span>
                    <span class="text-xs text-slate-400 uppercase">{{ doc.name.split('.').pop() }} 文件</span>
                  </div>
                </div>
              </td>
              
              <!-- 2. 大小列 -->
              <td class="p-4 text-slate-500 text-sm font-mono">{{ doc.size }}</td>
              
              <!-- 3. 所属空间 (仅Admin可见) -->
              <td v-if="user.role === 'admin'" class="p-4 text-slate-500 text-sm">
                <span :class="['px-2 py-1 rounded text-xs', doc.isGlobal ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600']">
                  {{ doc.workspace_name || (doc.isGlobal ? '公共知识库' : '未知部门') }}
                </span>
              </td>

              <!-- 4. 日期列 -->
              <td class="p-4 text-slate-500 text-sm">{{ doc.date }}</td>

              <!-- 5. 操作列 -->
              <td class="p-4 text-right whitespace-nowrap">
                <button v-if="canDelete(doc)" @click="handleDelete(doc)"
                  class="text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm font-medium flex items-center justify-end gap-1 ml-auto transition">
                  <Trash2 class="w-4 h-4" /> 删除
                </button>
                <span v-else class="text-slate-200 text-xs select-none pr-2">
                  不可操作
                </span>
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { 
  Upload, Database, Trash2, Globe, 
  FileText, FileSpreadsheet, FileCode2, FileImage, FileArchive, FileVideo, 
  Presentation, File
} from 'lucide-vue-next'
import { useDocuments } from '../composables/useDocuments'
import { useWorkspace } from '../composables/useWorkspace'
import { useAuth } from '../composables/useAuth'

const { docs, isUploading, isLoading, uploadFile, fetchDocuments } = useDocuments()
const { currentWorkspace } = useWorkspace()
const { user } = useAuth()

const fileInput = ref(null)

// 🔥 移除了 isPublicUpload 变量，直接依赖 user.role

const getFileConfig = (filename) => {
  if (!filename) return { icon: File, color: 'text-slate-500', bg: 'bg-slate-100' }
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf': return { icon: FileText, color: 'text-red-600', bg: 'bg-red-50' }
    case 'doc': case 'docx': return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' }
    case 'xls': case 'xlsx': case 'csv': return { icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50' }
    case 'ppt': case 'pptx': case 'key': return { icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-50' }
    case 'txt': case 'md': case 'json': case 'py': case 'js': case 'html': return { icon: FileCode2, color: 'text-slate-700', bg: 'bg-slate-100' }
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg': return { icon: FileImage, color: 'text-purple-600', bg: 'bg-purple-50' }
    case 'zip': case 'rar': case '7z': case 'tar': return { icon: FileArchive, color: 'text-yellow-600', bg: 'bg-yellow-50' }
    case 'mp4': case 'mov': case 'avi': return { icon: FileVideo, color: 'text-pink-600', bg: 'bg-pink-50' }
    default: return { icon: File, color: 'text-slate-500', bg: 'bg-slate-100' }
  }
}

const triggerUpload = () => fileInput.value.click()

const canDelete = (doc) => {
  if (user.value.role === 'admin') return true
  return doc.uploader_id === user.value.id
}

const handleDelete = async (doc) => {
  if (!confirm(`确定要永久删除文档 "${doc.name}" 吗？`)) return
  try {
    const res = await fetch(`http://localhost:8000/api/documents/${doc.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user.value.token}` }
    })
    if (!res.ok) throw new Error('删除失败')
    
    const index = docs.value.findIndex(d => d.id === doc.id)
    if (index !== -1) docs.value.splice(index, 1)
    
  } catch (error) {
    alert(`操作失败: ${error.message}`)
  }
}

const onFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  // 🔥 核心逻辑：直接根据角色决定是否为公共文档
  const isPublic = user.value.role === 'admin'

  // 2. 冲突检测
  const existingDoc = docs.value.find(d => {
    // 必须文件名相同
    if (d.name !== file.name) return false
    
    // 检查作用域冲突
    // Admin 上传公共文档 -> 检查已有的 Global 文档
    if (isPublic && d.isGlobal) return true
    
    // Member 上传部门文档 -> 检查已有的非 Global 文档
    if (!isPublic && !d.isGlobal) return true
    
    return false
  })

  // 3. 冲突提示
  if (existingDoc) {
    const scopeName = isPublic ? '公共' : '部门'
    const confirmOverwrite = confirm(
      `检测到同名${scopeName}文件：\n"${file.name}"\n\n继续上传将覆盖旧版本，且无法恢复。\n是否继续？`
    )
    if (!confirmOverwrite) {
      fileInput.value.value = ''
      return
    }
  }

  // 4. 执行上传
  try {
    await uploadFile(file, isPublic)
    alert(`上传成功: ${file.name}`)
    await fetchDocuments(currentWorkspace.value.id)
  } catch (err) {
    alert(`上传失败: ${err.message}`)
  } finally {
    fileInput.value.value = ''
  }
}

watch(() => currentWorkspace.value.id, (newId) => {
  if (newId) fetchDocuments(newId)
})

onMounted(() => {
  fetchDocuments(currentWorkspace.value.id)
})
</script>