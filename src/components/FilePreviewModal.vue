<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <!-- 弹窗容器 -->
      <div class="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden relative">
        
        <!-- 头部 -->
        <div class="h-14 border-b flex items-center justify-between px-6 bg-slate-50 shrink-0">
          <h3 class="font-bold text-slate-700 truncate max-w-md">{{ fileName }}</h3>
          <a v-if="fileUrl" :href="fileUrl" download class="mt-4 text-blue-600 hover:underline">点击下载原文件</a>
          <div class="flex items-center gap-4">
            <!-- 命中提示 -->
            <div v-if="highlightText" class="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200">
              定位引用: {{ highlightText.slice(0, 15) }}...
            </div>
            
            <button @click="close" class="p-2 hover:bg-slate-200 rounded-full transition">
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>
  
        <!-- 内容区域 -->
        <div class="flex-1 overflow-auto bg-slate-100 p-4 relative" ref="scrollContainer">
          
          <!-- 情况 A: PDF 预览 -->
          <div v-if="fileType === 'pdf'" class="mx-auto max-w-4xl shadow-lg relative bg-white">
            <VuePdfEmbed 
              :source="fileUrl" 
              :text-layer="true"
              @loaded="onPdfLoaded"
              @rendered="onPdfRendered"
              @error="onPdfError"
              class="pdf-container"
            />
          </div>
  
          <!-- 情况 B: 文本预览 -->
          <div v-else-if="fileType === 'text'" class="bg-white p-10 min-h-full max-w-4xl mx-auto shadow-sm text-slate-800 leading-loose whitespace-pre-wrap" v-html="highlightedHtml">
          </div>
  
          <!-- 情况 C: 不支持的格式 -->
          <div v-else class="flex flex-col items-center justify-center h-full text-slate-400">
            <FileQuestion class="w-16 h-16 mb-4" />
            <p>正在加载/格式不支持预览/文件不存在</p>
          </div>

        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, nextTick, watch } from 'vue'
  import { X, FileQuestion } from 'lucide-vue-next'
  import VuePdfEmbed from 'vue-pdf-embed'
  import * as pdfjsLib from 'pdfjs-dist'
  
  // 🔥🔥🔥 核心修复：使用 Vite 的 ?url 语法加载本地 Worker 🔥🔥🔥
  // 这会直接从 node_modules 里拿文件，不再发 CDN 请求，绝对稳定。
  import pdfWorker from 'pdfjs-dist/build/pdf.worker?url'
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
  
  const props = defineProps({
    isOpen: Boolean,
    fileName: String,
    highlightText: String, 
    userToken: String,
    docWorkspaceId: String
  })
  
  const emit = defineEmits(['close'])
  
  const fileUrl = ref('')
  const fileType = ref('')
  const textContent = ref('')
  const scrollContainer = ref(null)
  
  // 监听打开
  watch(() => props.isOpen, async (val) => {
    if (val && props.fileName) {
      await loadFile()
    } else {
      if (fileUrl.value) URL.revokeObjectURL(fileUrl.value)
      fileUrl.value = ''
      fileType.value = ''
      textContent.value = ''
    }
  })
  
  // 加载文件
  const loadFile = async () => {
    try {
      const wsId = props.docWorkspaceId || 'global'
      // 这里的参数名根据你后端的实际情况（doc_workspace_id 或 workspace_id）
      const url = `http://localhost:8000/api/files/${props.fileName}?doc_workspace_id=${wsId}`
      
      console.log('Requesting:', url) 
  
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${props.userToken}` }
      })
      
      if (!res.ok) throw new Error(`Status: ${res.status}`)
  
      const contentType = res.headers.get('content-type') || ''
      const isPdfHeader = contentType.includes('application/pdf')
      const isPdfExt = props.fileName.toLowerCase().endsWith('.pdf')
  
      if (isPdfHeader || isPdfExt) {
        const blob = await res.blob()
        fileUrl.value = URL.createObjectURL(blob)
        fileType.value = 'pdf'
      } else {
        const clone = res.clone()
        try {
          const data = await clone.json()
          if (data.type === 'text') {
            fileType.value = 'text'
            textContent.value = data.content
            nextTick(() => scrollToHighlight('mark'))
            return
          }
        } catch (e) {}
        fileType.value = 'unknown' 
      }
    } catch (e) {
      console.error('Preview Error:', e)
      fileType.value = 'unknown'
    }
  }
  
  const highlightedHtml = computed(() => {
    if (!props.highlightText || !textContent.value) return textContent.value
    const chunk = props.highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${chunk})`, 'gi')
    return textContent.value.replace(regex, '<mark class="bg-yellow-200 text-slate-900 px-1 rounded">$1</mark>')
  })
  
  const onPdfLoaded = () => {
    console.log('PDF Loaded')
  }
  
  const onPdfError = (err) => {
    console.error('PDF Render Error:', err)
  }
  
  // === 辅助函数：暴力清洗文本 ===
  // 只保留汉字、字母、数字。去掉所有标点、空格、特殊符号
  const normalizeText = (str) => {
    if (!str) return ''
    return str
      .toLowerCase()
      .replace(/\s+/g, '') // 去除所有空白
      .replace(/[，。！？：；“”‘’（）,\.!:;"'()]/g, '') // 去除中英文标点
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // 去除不可见字符
  }
  
  // === PDF 高亮核心逻辑 (生产环境版) ===
  const onPdfRendered = () => {
    if (!props.highlightText) return
  
    let attempt = 0
    const maxAttempts = 10 
  
    const tryHighlight = () => {
      attempt++
      const textLayer = document.querySelector('.textLayer')
      
      // 如果 DOM 还没准备好，重试
      if (!textLayer || textLayer.querySelectorAll('span').length === 0) {
        if (attempt < maxAttempts) {
          setTimeout(tryHighlight, 500)
        }
        return
      }
  
      const spans = textLayer.querySelectorAll('span')
      const cleanChunk = normalizeText(props.highlightText)
      
      if (cleanChunk.length < 2) return
  
      let matchCount = 0
      let firstMatch = null
  
      for (const span of spans) {
        const cleanSpan = normalizeText(span.textContent)
  
        // 跳过过短的碎片(防误伤)，但保留数字(如"120")
        // 如果全是数字，长度>1即可；如果是文字，建议>1
        if (cleanSpan.length < 2) continue
  
        // 核心匹配：只要 Chunk 包含这个 Span，说明这个 Span 属于引用段落的一部分
        if (cleanChunk.includes(cleanSpan)) {
          // 应用高亮样式
          span.style.backgroundColor = 'rgba(255, 235, 59, 0.5)' // 亮黄背景
          span.style.borderRadius = '2px'
          span.style.cursor = 'help' // 鼠标放上去变问号/手型
          span.title = "引用来源片段" // 鼠标悬停提示
          
          if (!firstMatch) firstMatch = span
          matchCount++
        }
      }
  
      // 滚动到第一个匹配点
      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  
    // 启动高亮流程
    tryHighlight()
  }
  
  const close = () => {
    emit('close')
  }
  
  const scrollToHighlight = (selector) => {
    const el = document.querySelector(selector)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  </script>
  
  <style>
  /* 容器 */
  .pdf-container {
    position: relative;
    width: 100%;
    height: auto;
    overflow: hidden; /* 防止溢出 */
  }
  
  /* 🔥🔥🔥 核心修复：文字层对齐修正 🔥🔥🔥 */
  .textLayer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    opacity: 1 !important; 
    mix-blend-mode: multiply;
    
    /* 关键：强制重置行高和变换原点，抵消 Tailwind 的影响 */
    line-height: 1.0 !important;
    transform-origin: 0 0 !important;
  }
  
  .textLayer span {
    color: transparent;
    position: absolute;
    white-space: pre;
    cursor: text;
    
    /* 关键：span 也要重置 */
    transform-origin: 0% 0% !important;
    line-height: 1.0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
  }
  
  /* 高亮样式 */
  .textLayer ::selection {
    background: rgba(0, 0, 255, 0.2);
  }
  
  /* 调试技巧：如果你想看看到底偏哪里去了，把 color 改成 red，opacity 改成 0.5 */
  /* 
  .textLayer span {
      color: red !important;
      opacity: 0.5;
  } 
  */
  </style>