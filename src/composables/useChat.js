import { ref } from 'vue'
import { useWorkspace } from './useWorkspace'
import { useAuth } from './useAuth'

export function useChat() {
  const { currentWorkspace } = useWorkspace()
  const { user } = useAuth()
  
  // 初始化消息，包含一条默认的欢迎语
  const messages = ref([
    { 
      role: 'assistant', 
      content: '你好！我是企业知识库助手，请问有什么可以帮你？',
      sources: [],
      thinking: false
    }
  ])
  const isLoading = ref(false)

  const sendMessage = async (message) => {
    if (!message.trim()) return

    const userText = message

    // 1. UI 立即显示用户提问
    messages.value.push({ role: 'user', content: userText })

    // 2. 添加 AI 的“思考中”占位符
    const aiMsgIndex = messages.value.push({ 
      role: 'assistant', 
      content: '', 
      sources: null,
      thinking: true
    }) - 1
  
    try {
      if (!user.value.token) {
        throw new Error("请先登录，才能使用聊天功能")
      }

      // === 🔥 核心修改点：构建历史上下文 ===
      // 我们需要发送：[欢迎语, 历史问, 历史答, ..., 当前问题]
      // 但是 messages.value 里现在多了一个 aiMsgIndex (占位符)，必须去掉它
      
      // A. 克隆并去掉最后一条 (占位符)
      const fullHistory = messages.value.slice(0, -1)
      
      // B. (可选) 限制上下文长度，比如只发最近 10 条，防止 Token 爆炸
      // 如果历史太长，取最后 10 条
      const limitedHistory = fullHistory.length > 10 
        ? fullHistory.slice(-10) 
        : fullHistory

      // C. 清洗数据，只发后端需要的字段 (role, content)
      const apiMessages = limitedHistory.map(m => ({
        role: m.role,
        content: m.content
      }))

      // 发送请求
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.value.token}`
        },
        body: JSON.stringify({
          // 🔥 这里发送的是数组，后端会取最后一条做 Query，剩下的做 History
          messages: apiMessages, 
          workspace_id: currentWorkspace.value.id,
          stream: true
        })
      })
  
      if (!response.ok) {
        if (response.status === 401) throw new Error("登录已过期，请重新登录")
        throw new Error(response.statusText)
      }
  
      // === 读取流 (逻辑保持不变) ===
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        
        const lines = buffer.split('\n')
        buffer = lines.pop() 
  
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const msg = JSON.parse(line)
            
            // 停止思考动画
            if (messages.value[aiMsgIndex].thinking) {
              messages.value[aiMsgIndex].thinking = false
            }

            if (msg.type === 'sources') {
              messages.value[aiMsgIndex].sources = msg.data
            } 
            else if (msg.type === 'content') {
              messages.value[aiMsgIndex].content += msg.data
              // 保持流畅打字机效果
              await new Promise(resolve => requestAnimationFrame(resolve))
            }
          } catch (e) {
            console.warn('解析错误:', line)
          }
        }
      }
  
    } catch (error) {
      console.error(error)
      messages.value[aiMsgIndex].thinking = false
      messages.value[aiMsgIndex].content += `\n[错误: ${error.message}]`
    }
  }

  const clearChat = () => {
    // 重置为只有一条欢迎语
    messages.value = [
      { 
        role: 'assistant', 
        content: '对话已重置。我是企业知识库助手，请问有什么可以帮你？',
        sources: [],
        thinking: false
      }
    ]
  }
  
  return {
    messages,
    sendMessage,
    isLoading,
    clearChat
  }
}