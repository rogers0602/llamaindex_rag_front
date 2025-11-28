<template>
  <div class="h-full p-8 overflow-y-auto">
    <div class="max-w-5xl mx-auto">
      <!-- 头部区域 -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">知识库管理</h2>
          <p class="text-slate-500">当前部门: {{ currentWorkspace.name }}</p>
        </div>

        <div class="flex items-center gap-4">
          <!-- ✨ 公共文档勾选框 (仅 Admin 可见) -->
          <div v-if="currentWorkspace.role === 'Admin'"
            class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
            @click="isPublicUpload = !isPublicUpload">
            <div class="w-5 h-5 rounded border flex items-center justify-center transition"
              :class="isPublicUpload ? 'bg-purple-600 border-purple-600' : 'border-slate-300 bg-white'">
              <svg v-if="isPublicUpload" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="text-sm font-medium text-slate-700 select-none">发布为公共文档</span>
          </div>

          <input type="file" ref="fileInput" class="hidden" accept=".pdf,.txt,.md,.docx" @change="onFileChange" />

          <button @click="triggerUpload" :disabled="isUploading" :class="[
            'flex items-center gap-2 text-white px-4 py-2 rounded-lg shadow disabled:opacity-50 transition',
            isPublicUpload ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
          ]">
            <Upload class="w-4 h-4" />
            {{ isUploading ? '上传中...' : (isPublicUpload ? '上传公共文档' : '上传部门文档') }}
          </button>
        </div>
      </div>

      <!-- 列表区域 (包含 Loading / Empty / Table 三种状态) -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">

        <!-- 1. 加载中状态 -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center h-[300px] text-slate-500 gap-3">
          <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p class="text-sm font-medium">正在同步文档数据...</p>
        </div>

        <!-- 2. 空数据状态 -->
        <div v-else-if="docs.length === 0" class="flex flex-col items-center justify-center h-[300px] text-slate-400">
          <Database class="w-16 h-16 mb-4 opacity-20" />
          <p>该部门暂无文档</p>
        </div>

        <!-- 3. 数据表格 -->
        <table v-else class="w-full text-left">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="p-4 text-sm font-semibold text-slate-600">文档名称</th>
              <th class="p-4 text-sm font-semibold text-slate-600">大小</th>
              <th class="p-4 text-sm font-semibold text-slate-600">状态</th>
              <th class="p-4 text-sm font-semibold text-slate-600">日期</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in docs" :key="doc.id" class="border-b last:border-0 hover:bg-slate-50 transition">
              <td class="p-4 flex items-center gap-3">
                <!-- 图标区分：公共 vs 私有 -->
                <div
                  :class="['p-2 rounded', doc.isGlobal ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600']">
                  <Globe v-if="doc.isGlobal" class="w-5 h-5" />
                  <FileText v-else class="w-5 h-5" />
                </div>
                <div class="flex flex-col">
                  <span class="font-medium text-slate-700 flex items-center gap-2">
                    {{ doc.name }}
                    <!-- 公共文档标签 -->
                    <span v-if="doc.isGlobal"
                      class="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 border border-purple-200 font-bold uppercase tracking-wider">
                      Global
                    </span>
                  </span>
                </div>
              </td>
              <td class="p-4 text-slate-500">{{ doc.size }}</td>
              <td class="p-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  {{ doc.status }}
                </span>
              </td>
              <td class="p-4 text-slate-500">{{ doc.date }}</td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
// ✨ 新增引入 Globe 和 Database 图标
import { Upload, FileText, Globe, Database } from 'lucide-vue-next'
import { useDocuments } from '../composables/useDocuments'
import { useWorkspace } from '../composables/useWorkspace'

// ✨ 核心修改：这里解构出了 isLoading
const { docs, isUploading, isLoading, uploadFile } = useDocuments()
const { currentWorkspace } = useWorkspace()

const fileInput = ref(null)
const isPublicUpload = ref(false)

const triggerUpload = () => fileInput.value.click()

const onFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  try {
    const targetId = isPublicUpload.value ? 'global' : null
    const filename = await uploadFile(file, targetId)
    alert(`上传成功: ${filename}`)
  } catch (err) {
    alert('上传失败，请检查后端服务')
  } finally {
    fileInput.value.value = ''
    // isPublicUpload.value = false // 可选：上传完是否重置勾选
  }
}
</script>