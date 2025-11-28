import { ref } from 'vue'

// --- 状态定义在函数外，实现全局单例模式 ---
const workspaces = [
  { id: '1', name: '研发中心', role: 'Admin' },
  { id: '2', name: '人力资源部', role: 'Member' },
  { id: '3', name: '财务部', role: 'Viewer' }
]

const currentWorkspace = ref(workspaces[0])

export function useWorkspace() {
  return {
    workspaces,
    currentWorkspace
  }
}