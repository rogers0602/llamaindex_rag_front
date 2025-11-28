import { ref, watch } from 'vue'
import { useWorkspace } from './useWorkspace'

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
      
      const res = await fetch(url)
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
  const uploadFile = async (file, targetWorkspaceId = null) => {
    if (!file) return
    isUploading.value = true

    const finalWorkspaceId = targetWorkspaceId || currentWorkspace.value.id
    const formData = new FormData()
    formData.append('file', file)
    formData.append('workspace_id', finalWorkspaceId)

    try {
      const res = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error('上传失败')
      const data = await res.json()
      
      // ✅ 关键：上传成功后，重新拉取最新的列表
      await fetchDocuments()
      
      return data.filename
    } catch (error) {
      console.error(error)
      throw error
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