<template>
  <div class="flex flex-col h-full bg-slate-50">
    <header class="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm shrink-0">
      <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <MessageSquare class="w-5 h-5 text-blue-600" />
        {{ currentWorkspace.name }} 专属助手
      </h2>
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
          <div v-else>
             <div 
               class="leading-relaxed prose prose-sm max-w-none min-h-[20px]" 
               :class="msg.role === 'user' ? 'prose-invert' : ''"
               v-html="md.render(msg.content || '')"
             ></div>
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
import { MessageSquare, Send, FileText, Loader2 } from 'lucide-vue-next'
import { useChat } from '../composables/useChat'
import { useWorkspace } from '../composables/useWorkspace'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()
const { messages, sendMessage, isLoading } = useChat()
const { currentWorkspace } = useWorkspace()

const input = ref('')
const messagesContainer = ref(null)

const handleSend = () => {
  if (!input.value.trim() || isLoading.value) return
  sendMessage(input.value)
  input.value = ''
}

// 自动滚动到底部
watch(messages, async () => {
  await nextTick()
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}, { deep: true })
</script>