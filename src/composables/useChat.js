import { ref } from 'vue'
import { useWorkspace } from './useWorkspace'

export function useChat() {
  const { currentWorkspace } = useWorkspace()
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

    // 显示用户提问
    messages.value.push({ role: 'user', content: userText })

    // sources: null 代表 "还没收到后端的数据"
    // thinking: true 代表 "正在等待第一个字节"
    const aiMsgIndex = messages.value.push({ 
      role: 'assistant', 
      content: '', 
      sources: null,   // <--- 改为 null
      thinking: true   // <--- 新增状态
    }) - 1
  
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userText }],
          workspace_id: currentWorkspace.value.id,
          stream: true // 告诉后端我要流式
        })
      })
  
      if (!response.ok) throw new Error(response.statusText)
  
      // === 关键点 3: 读取流 ===
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = '' // 用于拼接可能被切断的 JSON 字符串
  
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
            // 收到任何数据，就停止思考
            if (messages.value[aiMsgIndex].thinking) {
              messages.value[aiMsgIndex].thinking = false
            }
            if (msg.type === 'sources') {
              messages.value[aiMsgIndex].sources = msg.data
            } 
            else if (msg.type === 'content') {
              // 追加内容
              messages.value[aiMsgIndex].content += msg.data
              // 强制让 Vue 在这一刻去更新 DOM，而不是等待循环结束
              // 这会让字看起来是一个个蹦出来的，而不是一坨坨出现的
              await new Promise(resolve => requestAnimationFrame(resolve))
            }
          } catch (e) {
            console.warn('解析错误:', line)
          }
        }
      }
  
    } catch (error) {
      console.error(error)
      messages.value[aiMsgIndex].thinking = false // 出错也要停止思考
      messages.value[aiMsgIndex].content += '\n[系统错误: 连接断开]'
    }
  }

  return {
    messages,
    sendMessage,
    isLoading
  }
}