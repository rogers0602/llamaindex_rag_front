<template>
  <div class="flex flex-col h-full bg-slate-50">
    <header class="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm shrink-0">
      <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <MessageSquare class="w-5 h-5 text-blue-600" />
        <!-- 加个 ?. 防止报错 -->
        {{ currentWorkspace?.name }} 专属助手
      </h2>
    </header>

    <div class="flex-1 overflow-y-auto p-6 space-y-6" ref="messagesContainer">
      <div v-for="(msg, idx) in messages" :key="idx"
        :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']">
        <div
          :class="['max-w-2xl p-4 rounded-lg shadow-sm', msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border']">
          
          <div v-if="msg.thinking" class="flex items-center gap-2 text-slate-400 text-sm py-2">
            <Loader2 class="w-4 h-4 animate-spin" />
            <span>深度检索中...</span>
          </div>
          
          <div v-else class="relative group">
            <div 
              class="leading-relaxed prose prose-sm max-w-none min-h-[20px] select-text cursor-text" 
              :class="msg.role === 'user' ? 'prose-invert' : ''"
              v-html="md.render(msg.content || '')"
            ></div>
            <button 
              v-if="msg.role === 'assistant'"
              @click="copyToClipboard(msg.content, idx)"
              class="absolute -bottom-6 right-0 p-1.5 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs"
              title="复制内容"
            >
              <Check v-if="copiedIndex === idx" class="w-3.5 h-3.5 text-green-500" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span v-if="copiedIndex === idx" class="text-green-500">已复制</span>
              <span v-else>复制</span>
            </button>
          </div>
          
          <div v-if="msg.role === 'assistant' && msg.sources && !msg.thinking" class="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <p class="font-semibold mb-1 text-slate-700">引用来源:</p>
            <div v-if="msg.sources.length > 0" class="space-y-1">
              <div 
                v-for="(s, i) in msg.sources" :key="i" 
                @click="openPreview(s)" 
                class="flex items-center gap-1 text-slate-600 hover:text-blue-600 cursor-pointer transition">
                <FileText class="w-3 h-3 text-blue-500" /> 
                <!-- 如果 s 是对象显示 s.file_name，如果是字符串显示 s -->
                <span class="hover:underline">{{ s.file_name || s }}</span>
              </div>
            </div>
            <div v-else class="text-slate-400 italic flex items-center gap-1">
              <span class="w-3 h-3 inline-block"></span>
              无相关文档
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-4 bg-white border-t shrink-0">
      <div class="max-w-4xl mx-auto relative">
        <input v-model="input" @keydown.enter="handleSend" type="text" placeholder="请输入问题..."
          class="w-full p-4 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm select-text"
          :disabled="isLoading" />
        <button @click="handleSend"
          class="absolute right-3 top-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Send class="w-4 h-4" />
        </button>
      </div>
    </div>
    <FilePreviewModal 
      :is-open="isPreviewOpen"
      :file-name="previewFileName"
      :highlight-text="previewHighlight"
      :user-token="user.token"
      :doc-workspace-id="docWorkspaceId"
      @close="isPreviewOpen = false"
    />
  </div>
</template>

<script setup>
// 🔥🔥🔥 修正点：补全 onMounted
import { ref, watch, nextTick, onMounted } from 'vue' 
import { MessageSquare, Send, FileText, Loader2, Copy, Check } from 'lucide-vue-next'
import { useChat } from '../composables/useChat'
import { useWorkspace } from '../composables/useWorkspace'
import MarkdownIt from 'markdown-it'
import FilePreviewModal from '../components/FilePreviewModal.vue'
import { useAuth } from '../composables/useAuth'

const isPreviewOpen = ref(false)
const previewFileName = ref('')
const previewHighlight = ref('')
const docWorkspaceId = ref('')
const { user } = useAuth()

const md = new MarkdownIt()
const { messages, sendMessage, isLoading } = useChat()
const { currentWorkspace } = useWorkspace()

const input = ref('')
const messagesContainer = ref(null)
const copiedIndex = ref(-1)

const handleSend = () => {
  if (!input.value.trim() || isLoading.value) return
  sendMessage(input.value)
  input.value = ''
}

const openPreview = (source) => {
  // source 对象应该包含: { file_name: 'xxx.pdf', text_chunk: '...' }
  previewFileName.value = source.file_name || source // 兼容旧数据
  previewHighlight.value = source.text_chunk || ''   // 获取高亮片段
  isPreviewOpen.value = true,
  docWorkspaceId.value = source.workspace_id || ''
}

const copyToClipboard = async (text, idx) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedIndex.value = idx
    setTimeout(() => { copiedIndex.value = -1 }, 2000)
  } catch (err) {
    console.error('复制失败', err)
  }
}

const scrollToBottom = async (smooth = true) => {
  await nextTick()
  if (messagesContainer.value) {
    const el = messagesContainer.value
    
    // 关键修改：初始化时使用 scrollTop 直接赋值，比 scrollTo 更可靠
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      el.scrollTop = el.scrollHeight
    }
  }
}

// 监听消息变化 (保持平滑滚动)
watch(messages, () => {
  scrollToBottom(true)
}, { deep: true })

// 组件挂载/切换回来时 (强制滚动到底部)
onMounted(async () => {
  // 1. 立即尝试一次
  await scrollToBottom(false)
  
  // 2. 延迟执行：给浏览器一点时间完成布局渲染 (Markdown渲染、CSS加载等)
  // 如果 100ms 还是不行，可以尝试改成 300ms，通常 100-200ms 足够
  setTimeout(() => {
    scrollToBottom(false)
  }, 200)
})
</script>