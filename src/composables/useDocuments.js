import { ref, watch } from 'vue'
import { useWorkspace } from './useWorkspace'
import { useAuth } from './useAuth'

const { user } = useAuth()

export function useDocuments() {
  const { currentWorkspace } = useWorkspace()
  
  const docs = ref([])        // 文档列表
  const isUploading = ref(false)
  const isLoading = ref(false) // 加载列表时的状态

  // 1. 获取文档列表的核心方法
  const fetchDocuments = async () => {
    if (!currentWorkspace.value) return
    
    isLoading.value = true
    try {
      // 构造请求 URL，带上 workspace_id 参数
      const url = `http://localhost:8000/api/documents?workspace_id=${currentWorkspace.value.id}`
      
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${user.value.token}` }
      })
      if (!res.ok) throw new Error('获取列表失败')
      
      const data = await res.json()
      docs.value = data // 直接赋值后端返回的真实数据
      
    } catch (error) {
      console.error("加载文档出错:", error)
      docs.value = [] // 出错置空
    } finally {
      isLoading.value = false
    }
  }

  // 2. 自动监听部门变化
  // immediate: true 保证组件刚加载时也会执行一次
  watch(currentWorkspace, () => {
    fetchDocuments()
  }, { immediate: true })

  // 3. 上传文件 (修改版：上传完自动刷新)
  const uploadFile = async (file, isPublic = false) => {
    isUploading.value = true
    const formData = new FormData()
    formData.append('file', file)
    
    // 🔥 关键：必须显式添加 is_public 字段
    // 后端 FastAPI 用 is_public: bool = Form(False) 接收
    formData.append('is_public', isPublic) 

    try {
      const res = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        body: formData
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || '上传失败')
      }

      // 上传成功后刷新列表
      // 注意：这里需要根据逻辑决定是否重新 fetch，或者由组件控制
      // 简单起见，这里返回 filename
      return file.name
    } finally {
      isUploading.value = false
    }
  }

  return {
    docs,
    isUploading,
    isLoading, // 导出加载状态供前端显示 loading 动画
    uploadFile,
    fetchDocuments
  }
}