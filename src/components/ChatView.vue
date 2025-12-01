<template>
  <div class="flex flex-col h-full bg-slate-50">
    <header class="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm shrink-0">
      <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <MessageSquare class="w-5 h-5 text-blue-600" />
        {{ currentWorkspace.name }} 专属助手
      </h2>
      <button 
        @click="clearHistory" 
        class="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-slate-100 transition"
        title="开启新话题，清除上下文记忆">
        <Eraser class="w-3 h-3" /> 新对话
      </button>
    </header>

    <div class="flex-1 overflow-y-auto p-6 space-y-6" ref="messagesContainer">
      <div v-for="(msg, idx) in messages" :key="idx"
        :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']">
        <div
          :class="['max-w-2xl p-4 rounded-lg shadow-sm', msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border']">
          
          <!-- 1. 思考中状态 (Thinking Indicator) -->
          <div v-if="msg.thinking" class="flex items-center gap-2 text-slate-400 text-sm py-2">
            <Loader2 class="w-4 h-4 animate-spin" />
            <span>深度检索中...</span>
          </div>
          
          <!-- 2. 正文内容 (只有当内容不为空，或者不在思考时才显示) -->
          <div v-else class="relative group"> <!-- 添加 relative 和 group -->
            <!-- 文章内容 -->
            <div 
              class="leading-relaxed prose prose-sm max-w-none min-h-[20px] select-text cursor-text" 
              :class="msg.role === 'user' ? 'prose-invert' : ''"
              v-html="md.render(msg.content || '')"
            ></div>
            <!-- ✨✨✨ 新增：复制按钮 (仅 AI 回复显示，且鼠标悬停时才显示) ✨✨✨ -->
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
          <!-- 3. 引用来源 -->
          <!-- 修改逻辑: 只有 sources 不为 null 时才渲染整个块 -->
          <div v-if="msg.sources && !msg.thinking" class="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <p class="font-semibold mb-1 text-slate-700">引用来源:</p>

            <div v-if="msg.sources.length > 0" class="space-y-1">
              <div v-for="(s, i) in msg.sources" :key="i" class="flex items-center gap-1 text-slate-600">
                <FileText class="w-3 h-3 text-blue-500" /> {{ s }}
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
          class="w-full p-4 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          :disabled="isLoading" />
        <button @click="handleSend"
          class="absolute right-3 top-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Send class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { MessageSquare, Send, FileText, Loader2, Eraser } from 'lucide-vue-next'
import { useChat } from '../composables/useChat'
import { useWorkspace } from '../composables/useWorkspace'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()
const { messages, sendMessage, isLoading, clearChat  } = useChat()
const { currentWorkspace } = useWorkspace()

const input = ref('')
const messagesContainer = ref(null)

const handleSend = () => {
  if (!input.value.trim() || isLoading.value) return
  sendMessage(input.value)
  input.value = ''
}

const clearHistory = () => {
  if (confirm('确定要清空当前对话记录吗？')) {
    clearChat()
  }
}

const copiedIndex = ref(-1) // 记录当前哪个消息显示“已复制”

const copyToClipboard = async (text, idx) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedIndex.value = idx
    
    // 2秒后恢复图标
    setTimeout(() => {
      copiedIndex.value = -1
    }, 2000)
  } catch (err) {
    console.error('复制失败', err)
  }
}

// 自动滚动到底部
watch(messages, async () => {
  await nextTick()
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}, { deep: true })
</script>