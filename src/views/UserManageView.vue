<template>
    <div class="h-full p-8 overflow-y-auto bg-slate-50">
      <div class="max-w-5xl mx-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-slate-800">人员管理</h2>
          <button @click="showAddModal = true" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow transition">
            + 新增人员
          </button>
        </div>
  
        <!-- 🔥 新增：搜索过滤栏 -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex flex-wrap items-center gap-4">
          <!-- 用户名搜索 -->
          <div class="relative w-64">
            <input 
              v-model="filters.keyword" 
              type="text" 
              placeholder="搜索用户名..." 
              class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
  
          <!-- 部门筛选 -->
          <div class="w-48">
            <select 
              v-model="filters.deptId" 
              class="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">所有部门</option>
              <option v-for="d in depts" :key="d.id" :value="d.id">
                {{ d.name }}
              </option>
            </select>
          </div>
  
          <!-- 重置按钮 -->
          <button 
            v-if="filters.keyword || filters.deptId"
            @click="resetFilters"
            class="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            重置筛选
          </button>
  
          <div class="ml-auto text-sm text-slate-400">
            共 {{ filteredUsers.length }} 人
          </div>
        </div>
  
        <!-- 人员列表 -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          <table class="w-full text-left">
            <thead class="bg-slate-50 border-b">
              <tr>
                <th class="p-4 text-sm font-semibold text-slate-600">用户名</th>
                <th class="p-4 text-sm font-semibold text-slate-600">邮箱</th>
                <th class="p-4 text-sm font-semibold text-slate-600">部门</th>
                <th class="p-4 text-sm font-semibold text-slate-600">角色</th>
                <th class="p-4 text-right text-sm font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              <!-- 🔥 修改：遍历 filteredUsers 而不是 users -->
              <tr v-for="u in filteredUsers" :key="u.id" class="border-b hover:bg-slate-50 transition">
                <td class="p-4 font-medium">{{ u.username }}</td>
                <td class="p-4 text-slate-500 text-sm">{{ u.email }}</td>
                <td class="p-4">
                  <span class="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                    {{ u.dept_name }}
                  </span>
                </td>
                <td class="p-4">
                  <span :class="['px-2 py-1 rounded-full text-xs font-bold uppercase', u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700']">
                    {{ u.role }}
                  </span>
                </td>
                <td class="p-4 text-right">
                  <button v-if="u.role !== 'admin'" @click="deleteUser(u)" class="text-red-500 hover:text-red-700 text-sm font-medium">删除</button>
                </td>
              </tr>
              
              <!-- 空状态提示 -->
              <tr v-if="filteredUsers.length === 0">
                <td colspan="5" class="p-12 text-center text-slate-400">
                  没有找到符合条件的人员
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <!-- 新增人员弹窗 (保持不变) -->
        <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 class="text-lg font-bold mb-4">添加新成员</h3>
            <div class="space-y-4">
              <div>
                <label class="text-sm text-slate-600">用户名 (登录账号)</label>
                <input v-model="form.username" class="w-full border p-2 rounded mt-1" placeholder="请输入唯一用户名" />
              </div>
              
              <div>
                <label class="text-sm text-slate-600">初始密码</label>
                <input v-model="form.password" type="password" class="w-full border p-2 rounded mt-1" placeholder="请输入密码" />
              </div>
              
              <div>
                <label class="text-sm text-slate-600">确认密码</label>
                <input v-model="form.confirmPassword" type="password" class="w-full border p-2 rounded mt-1" placeholder="请再次输入密码" />
              </div>
  
              <div>
                <label class="text-sm text-slate-600">所属部门</label>
                <select v-model="form.department_id" class="w-full border p-2 rounded mt-1 bg-white">
                  <option v-for="d in depts" :key="d.id" :value="d.id">{{ d.name }}</option>
                </select>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
              <button @click="showAddModal = false" class="text-slate-500 px-4 py-2 hover:bg-slate-100 rounded">取消</button>
              <button @click="submitAdd" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">确定添加</button>
            </div>
          </div>
        </div>
  
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted, computed } from 'vue' // 🔥 引入 computed
  import { useAuth } from '../composables/useAuth'
  
  const { user } = useAuth()
  const users = ref([]) // 原始数据
  const depts = ref([])
  const showAddModal = ref(false)
  
  // 🔥 新增：筛选条件状态
  const filters = reactive({
    keyword: '',
    deptId: ''
  })
  
  const form = reactive({
    username: '', 
    password: '', 
    confirmPassword: '', 
    department_id: ''
  })
  
  // 🔥 新增：计算属性，动态过滤用户
  const filteredUsers = computed(() => {
    return users.value.filter(u => {
      // 1. 匹配用户名 (不区分大小写)
      const matchName = u.username.toLowerCase().includes(filters.keyword.toLowerCase())
      
      // 2. 匹配部门 (如果选了部门ID，则必须匹配；没选则通过)
      const matchDept = !filters.deptId || u.dept_id === filters.deptId
      
      return matchName && matchDept
    })
  })
  
  // 🔥 新增：重置筛选
  const resetFilters = () => {
    filters.keyword = ''
    filters.deptId = ''
  }
  
  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${user.value.token}` }
    const [resU, resD] = await Promise.all([
      fetch('http://localhost:8000/api/admin/users', { headers }),
      fetch('http://localhost:8000/api/admin/departments', { headers })
    ])
    if(resU.ok) users.value = await resU.json()
    if(resD.ok) depts.value = await resD.json()
  }
  
  const submitAdd = async () => {
    if(!form.username || !form.password || !form.department_id) {
      alert("请填写完整信息")
      return
    }
    
    if (form.password !== form.confirmPassword) {
      alert("两次输入的密码不一致，请重新输入")
      return
    }
    
    const payload = {
      username: form.username,
      password: form.password,
      department_id: form.department_id
    }
  
    const res = await fetch('http://localhost:8000/api/admin/users', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${user.value.token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload)
    })
    
    if(res.ok) {
      alert('添加成功')
      showAddModal.value = false
      form.username = ''; 
      form.password = ''; 
      form.confirmPassword = '';
      fetchData()
    } else {
      const err = await res.json()
      alert(err.detail || '添加失败')
    }
  }
  
  const deleteUser = async (u) => {
    if(!confirm(`确定要删除用户 ${u.username} 吗？`)) return
    
    const res = await fetch(`http://localhost:8000/api/admin/users/${u.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user.value.token}` }
    })
    if(res.ok) {
      fetchData()
    } else {
      alert("删除失败")
    }
  }
  
  onMounted(fetchData)
  </script>