import { ref } from 'vue'
import { useWorkspace } from './useWorkspace'
import { useAuth } from './useAuth'

// 🔥 全局状态 (State) - 放在函数外部，保证多组件共享
const messages = ref([
  { 
    role: 'assistant', 
    content: '你好！我是企业知识库助手，请问有什么可以帮你？', 
    sources: [], thinking: false 
  }
])
const currentSessionId = ref(null)
const sessionList = ref([]) 
const isLoading = ref(false)

export function useChat() {
  const { currentWorkspace } = useWorkspace()
  const { user } = useAuth()
  
  // A. 获取历史列表 (含自动恢复逻辑)
  const fetchSessions = async () => {
    if (!user.value.token) return
    try {
      const res = await fetch('http://localhost:8000/api/chat/sessions', {
        headers: { 'Authorization': `Bearer ${user.value.token}` }
      })
      if (res.ok) {
        sessionList.value = await res.json()
        
        // 🔥 核心逻辑：刷新页面后，自动恢复上次的会话
        const lastSessionId = localStorage.getItem('last_session_id')
        
        // 只有当当前没有选中的会话，且本地有缓存时，才尝试恢复
        if (lastSessionId && !currentSessionId.value) {
          const exists = sessionList.value.find(s => s.id === lastSessionId)
          if (exists) {
            await loadSession(lastSessionId)
          } else {
            // 如果缓存的会话在后端已被删除，清理缓存
            localStorage.removeItem('last_session_id')
          }
        }
      }
    } catch (e) {
      console.error("获取会话列表失败", e)
    }
  }

  // B. 加载某个会话
  const loadSession = async (sessionId) => {
    if(isLoading.value) return
    isLoading.value = true
    currentSessionId.value = sessionId
    // 记录到本地，防止刷新丢失
    localStorage.setItem('last_session_id', sessionId)
    
    try {
      const res = await fetch(`http://localhost:8000/api/chat/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${user.value.token}` }
      })
      const data = await res.json()
      // 转换数据格式
      messages.value = data.map(m => ({
        role: m.role,
        content: m.content,
        // 这里 sources 是个对象有多个字段，有file_name workspace_id
        sources: m.sources || [], 
        raw_sources: m.sources, 
        thinking: false
      }))
    } catch(e) {
        console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  // C. 开启新会话 (Sidebar 调用)
  const createNewSession = () => {
    currentSessionId.value = null
    // 清除本地缓存，确保刷新后是新会话状态
    localStorage.removeItem('last_session_id')
    messages.value = [{ 
      role: 'assistant', 
      content: '你好！我是企业知识库助手，请问有什么可以帮你？', 
      sources: [], 
      thinking: false 
    }]
  }

  // D. 发送消息
  const sendMessage = async (message) => {
    if (!message.trim()) return

    const userText = message
    messages.value.push({ role: 'user', content: userText })

    const aiMsgIndex = messages.value.push({ 
      role: 'assistant', 
      content: '', 
      sources: null,
      thinking: true
    }) - 1
  
    try {
      if (!user.value.token) throw new Error("请先登录")

      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.value.token}`
        },
        body: JSON.stringify({
          messages: [{role: 'user', content: message}], 
          workspace_id: currentWorkspace.value.id,
          session_id: currentSessionId.value,
          stream: true
        })
      })
  
      if (!response.ok) {
        if (response.status === 401) throw new Error("登录已过期")
        throw new Error(response.statusText)
      }
  
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() 
  
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const msg = JSON.parse(line)
            
            if (messages.value[aiMsgIndex].thinking) {
              messages.value[aiMsgIndex].thinking = false
            }
            
            // 🔥 收到新 Session ID
            if (msg.type === 'session_id') {
              currentSessionId.value = msg.data
              localStorage.setItem('last_session_id', msg.data)
              // 不用 await，让它在后台刷就行
              fetchSessions()
            }
            else if (msg.type === 'sources') {
              messages.value[aiMsgIndex].sources = msg.data
            } 
            else if (msg.type === 'content') {
              messages.value[aiMsgIndex].content += msg.data
              await new Promise(r => requestAnimationFrame(r))
            }
          } catch (e) {
            console.warn('解析错误:', line)
          }
        }
      }
      // 结束后刷新列表以更新时间排序
      await fetchSessions()
  
    } catch (error) {
      console.error(error)
      messages.value[aiMsgIndex].thinking = false
      messages.value[aiMsgIndex].content += `\n[错误: ${error.message}]`
    }
  }

  const deleteSession = async (sessionId) => {
    if (!sessionId) return
    
    try {
      const res = await fetch(`http://localhost:8000/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.value.token}` }
      })

      if (!res.ok) throw new Error('删除失败')

      // 1. 从本地列表移除
      sessionList.value = sessionList.value.filter(s => s.id !== sessionId)

      // 2. 如果删除的是当前选中的会话，重置为新对话状态
      if (currentSessionId.value === sessionId) {
        createNewSession()
      }
      
    } catch (e) {
      console.error(e)
      alert("删除会话失败")
    }
  }
  
  return {
    messages, sessionList, currentSessionId,
    fetchSessions, loadSession, createNewSession, sendMessage, isLoading, deleteSession
  }
}