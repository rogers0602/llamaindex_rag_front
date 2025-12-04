<template>
  <div class="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0">
    <!-- Logo -->
    <div class="p-4 border-b border-slate-800 flex items-center gap-2 font-bold text-white text-lg">
      <Bot class="w-6 h-6 text-blue-500" />
      <span>企业知识库</span>
    </div>

    <!-- 部门信息 -->
    <div class="p-4">
      <div class="text-xs font-semibold text-slate-500 mb-2 uppercase">所属部门 (Workspace)</div>
      <div class="w-full bg-slate-800 text-white p-3 rounded flex items-center justify-between border border-slate-700">
        <div class="flex items-center gap-2 overflow-hidden">
          <Building2 class="w-4 h-4 text-blue-400 shrink-0" />
          <span class="truncate font-medium">{{ currentWorkspace?.name || '加载中...' }}</span>
        </div>
      </div>
      <div class="text-xs text-slate-500 mt-2 flex justify-between items-center px-1">
        <span>角色: <span class="text-slate-300">{{ user.role === 'admin' ? '管理员' : '成员' }}</span></span>
        <span class="flex items-center gap-1 text-green-500">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
        </span>
      </div>
    </div>

    <!-- 历史会话区域 -->
    <div v-if="activeTab === 'chat'" class="flex-1 overflow-y-auto px-2 mt-4">
      <div class="flex justify-between items-center mb-2 px-2">
        <span class="text-xs font-bold text-slate-500 uppercase">历史记录</span>
        <button @click="createNewSession" class="text-xs text-blue-400 hover:text-blue-300">
          + 新对话
        </button>
      </div>
      
      <!-- Sidebar.vue 部分代码 -->

      <div class="space-y-1">
        <!-- 外层容器：必须有 group 和 relative -->
        <div 
          v-for="s in sessionList" :key="s.id"
          class="group relative flex items-center mb-1" 
        >
          <!-- 1. 会话标题按钮 -->
          <!-- 注意 pr-9：给右边的删除按钮留出空间 -->
          <button 
            @click="loadSession(s.id)"
            :class="[
              'w-full text-left text-sm p-2 pr-9 rounded truncate transition', 
              currentSessionId === s.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            ]"
            :title="s.title"
          >
            {{ s.title }}
          </button>

          <!-- 2. 删除按钮 -->
          <!-- 绝对定位到右侧，默认 opacity-0 (透明)，鼠标悬停(group-hover)时变成 100 -->
          <!-- z-10 确保它在最上层，可以被点击 -->
          <button 
            @click.stop="handleDeleteSession(s)"
            class="absolute right-1 p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            title="删除会话"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="flex-1 px-2 space-y-1 mt-2">
      <button 
        v-for="tab in visibleTabs" 
        :key="tab.id"
        @click="handleNav(tab.id)"
        :class="[
          'w-full flex items-center gap-3 p-2 rounded transition',
          activeTab === tab.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'
        ]"
      >
        <component :is="tab.icon" class="w-5 h-5" /> {{ tab.label }}
      </button>
    </nav>

    <!-- 底部用户信息 & 操作按钮 -->
    <div class="p-4 border-t border-slate-800 space-y-3">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          {{ user.username ? user.username.substring(0, 1).toUpperCase() : 'U' }}
        </div>
        <div class="overflow-hidden flex-1">
          <div class="text-sm text-white font-medium truncate">{{ user.username }}</div>
          <div class="text-xs text-slate-500 truncate">已登录</div>
        </div>
        
        <button @click="showPwdModal = true" title="修改密码" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
          <Key class="w-3.5 h-3.5" />
        </button>
      </div>
      
      <button @click="handleLogout" class="w-full flex items-center justify-center gap-2 text-xs bg-slate-800 hover:bg-red-900/50 hover:text-red-400 text-slate-400 py-2 rounded transition">
        <LogOut class="w-3 h-3" /> 退出登录
      </button>
    </div>

    <!-- 修改密码弹窗 -->
    <div v-if="showPwdModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div class="bg-white text-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
          <Key class="w-5 h-5 text-blue-600" /> 修改密码
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">旧密码</label>
            <input v-model="pwdForm.old" type="password" class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">新密码</label>
            <input v-model="pwdForm.new" type="password" class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">确认新密码</label>
            <input v-model="pwdForm.confirm" type="password" class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button @click="closePwdModal" class="text-slate-500 px-4 py-2 hover:bg-slate-100 rounded text-sm transition">取消</button>
          <button @click="submitChangePwd" class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 shadow transition">确认修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 🔥🔥🔥 修正点：所有 import 必须在最顶部
import { computed, ref, reactive, onMounted } from 'vue' 
import { useRouter } from 'vue-router'
import { Bot, MessageSquare, Database, Building2, LogOut, Users, Key, Trash2 } from 'lucide-vue-next'
import { useWorkspace } from '../composables/useWorkspace'
import { useAuth } from '../composables/useAuth'
import { useChat } from '../composables/useChat' // 引入 useChat

const props = defineProps(['activeTab'])
const emit = defineEmits(['change-tab'])
const router = useRouter()
const { currentWorkspace } = useWorkspace()
const { user, logout } = useAuth()
// 🔥🔥🔥 修正点：useChat 逻辑放在这里
const { sessionList, fetchSessions, loadSession, createNewSession, deleteSession, currentSessionId } = useChat()

const allTabs = [
  { id: 'chat', label: '智能问答', icon: MessageSquare, roles: ['admin', 'member'] },
  { id: 'knowledge', label: '知识库管理', icon: Database, roles: ['admin', 'member'] },
  { id: 'departments', label: '部门管理', icon: Building2, roles: ['admin'] },
  { id: 'users', label: '人员管理', icon: Users, roles: ['admin'] },
]

const visibleTabs = computed(() => {
  return allTabs.filter(tab => tab.roles.includes(user.value.role))
})

const handleNav = (id) => {
  emit('change-tab', id)
}

const handleLogout = () => {
  if(confirm('确定要退出登录吗？')) {
    logout()
  }
}

const handleDeleteSession = async (session) => {
  if (confirm(`确认删除会话 "${session.title}" 吗？`)) {
    await deleteSession(session.id)
  }
}

// 密码逻辑
const showPwdModal = ref(false)
const pwdForm = reactive({ old: '', new: '', confirm: '' })

const closePwdModal = () => {
  showPwdModal.value = false
  pwdForm.old = ''
  pwdForm.new = ''
  pwdForm.confirm = ''
}

const submitChangePwd = async () => {
  if (!pwdForm.old || !pwdForm.new || !pwdForm.confirm) {
    alert("请填写所有字段")
    return
  }
  if (pwdForm.new !== pwdForm.confirm) {
    alert("两次新密码输入不一致")
    return
  }
  if (pwdForm.new.length < 6) {
    alert("新密码至少需要6位")
    return
  }
  try {
    const res = await fetch('http://localhost:8000/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.value.token}`
      },
      body: JSON.stringify({
        old_password: pwdForm.old,
        new_password: pwdForm.new
      })
    })
    const data = await res.json()
    if (res.ok) {
      alert("密码修改成功，请重新登录")
      logout()
    } else {
      alert(data.detail || "修改失败")
    }
  } catch (e) {
    alert("网络请求失败")
  }
}

// 🔥🔥🔥 修正点：onMounted 正确使用
onMounted(() => {
  fetchSessions()
})
</script>