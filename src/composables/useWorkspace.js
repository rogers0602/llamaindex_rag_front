import { ref } from 'vue'

// 默认空状态
const currentWorkspace = ref({ 
  id: 'global', 
  name: '公共知识库', 
  role: 'Member' 
})

export function useWorkspace() {
  
  const setWorkspace = (ws) => {
    currentWorkspace.value = {
      id: ws.id || 'global',
      name: ws.name || '未分配部门',
      role: ws.role || 'member'
    }
  }

  return {
    currentWorkspace,
    setWorkspace
  }
}