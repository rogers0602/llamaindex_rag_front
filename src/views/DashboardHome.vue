<template>
    <div class="h-full p-8 overflow-y-auto bg-slate-50">
      <div class="max-w-6xl mx-auto space-y-8">
        
        <!-- 1. 欢迎语 -->
        <div>
          <h1 class="text-2xl font-bold text-slate-800">
            欢迎回来，{{ user.username }} 👋
          </h1>
          <p class="text-slate-500 mt-1">这里是您的企业知识库概览。</p>
        </div>
  
        <!-- 2. 核心指标卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- 文档总数 -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div class="p-3 rounded-lg bg-blue-50 text-blue-600">
              <FileText class="w-8 h-8" />
            </div>
            <div>
              <div class="text-sm text-slate-500">知识库文档</div>
              <div class="text-2xl font-bold text-slate-800">{{ stats.metrics.total_docs }} <span class="text-xs font-normal text-slate-400">份</span></div>
            </div>
          </div>
  
          <!-- 对话次数 -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div class="p-3 rounded-lg bg-green-50 text-green-600">
              <MessageSquare class="w-8 h-8" />
            </div>
            <div>
              <div class="text-sm text-slate-500">累计智能问答</div>
              <div class="text-2xl font-bold text-slate-800">{{ stats.metrics.total_chats }} <span class="text-xs font-normal text-slate-400">次</span></div>
            </div>
          </div>
  
          <!-- 所属部门 -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div class="p-3 rounded-lg bg-orange-50 text-orange-600">
              <Building2 class="w-8 h-8" />
            </div>
            <div class="overflow-hidden">
              <div class="text-sm text-slate-500">当前部门空间</div>
              <div class="text-lg font-bold text-slate-800 truncate" :title="stats.metrics.dept_name">
                {{ stats.metrics.dept_name || '公共区' }}
              </div>
            </div>
          </div>
  
          <!-- 用户总数 (仅管理员可见，非管理员显示系统状态) -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div class="p-3 rounded-lg bg-purple-50 text-purple-600">
              <Users v-if="user.role === 'admin'" class="w-8 h-8" />
              <Activity v-else class="w-8 h-8" />
            </div>
            <div>
              <div class="text-sm text-slate-500">{{ user.role === 'admin' ? '总用户数' : '系统状态' }}</div>
              <div class="text-2xl font-bold text-slate-800">
                {{ user.role === 'admin' ? stats.metrics.user_count : 'Running' }}
              </div>
            </div>
          </div>
        </div>
  
        <!-- 3. 图表区域 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80">
          <!-- 知识分布 (饼图) -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1 flex flex-col">
            <h3 class="font-bold text-slate-700 mb-4">知识类型分布</h3>
            <div class="flex-1 min-h-0">
              <v-chart class="chart" :option="pieOption" autoresize />
            </div>
          </div>
  
          <!-- 活跃趋势 (折线图 - 这里用模拟数据演示UI) -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col">
            <h3 class="font-bold text-slate-700 mb-4">近7天活跃趋势 (Mock)</h3>
            <div class="flex-1 min-h-0">
              <v-chart class="chart" :option="lineOption" autoresize />
            </div>
          </div>
        </div>
  
        <!-- 4. 最近上传列表 -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 class="font-bold text-slate-700">最新入库文档</h3>
            <button @click="$emit('switch-tab', 'knowledge')" class="text-sm text-blue-600 hover:underline">管理文档 &rarr;</button>
          </div>
          <table class="w-full text-left">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th class="px-6 py-3">文件名</th>
                <th class="px-6 py-3">上传者</th>
                <th class="px-6 py-3">上传日期</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="doc in stats.recent_docs" :key="doc.id" class="hover:bg-slate-50">
                <td class="px-6 py-3 flex items-center gap-2">
                  <FileText class="w-4 h-4 text-slate-400" />
                  <span class="text-sm text-slate-700 font-medium truncate max-w-xs">{{ doc.name }}</span>
                </td>
                <td class="px-6 py-3 text-sm text-slate-500">{{ doc.uploader }}</td>
                <td class="px-6 py-3 text-sm text-slate-500">{{ doc.date }}</td>
              </tr>
              <tr v-if="stats.recent_docs.length === 0">
                <td colspan="3" class="px-6 py-8 text-center text-slate-400 text-sm">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
  
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue'
  import { FileText, MessageSquare, Users, Building2, Activity } from 'lucide-vue-next'
  import { useAuth } from '../composables/useAuth'
  
  defineEmits(['switch-tab']) // 用于跳转 Tab
  
  const { user } = useAuth()
  
  // 数据状态
  const stats = ref({
    metrics: { total_docs: 0, total_chats: 0, user_count: 0, dept_name: '' },
    charts: { file_types: [] },
    recent_docs: []
  })
  
  // 获取数据
  const fetchStats = async () => {
    if (!user.value.token) return
    try {
      const res = await fetch('http://localhost:8000/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${user.value.token}` }
      })
      if (res.ok) {
        stats.value = await res.json()
      }
    } catch (e) {
      console.error('获取统计失败', e)
    }
  }
  
  onMounted(() => {
    fetchStats()
  })
  
  // --- ECharts 配置 ---
  
  // 1. 饼图配置 (响应式)
  const pieOption = computed(() => ({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center' },
    series: [
      {
        name: '文件类型',
        type: 'pie',
        radius: ['40%', '70%'], // 环形图
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold' }
        },
        data: stats.value.charts.file_types.length > 0 
          ? stats.value.charts.file_types 
          : [{ value: 0, name: '无数据' }] // 空状态
      }
    ]
  }))
  
  // 2. 折线图配置
  const lineOption = computed(() => {
    // 从 stats 中获取数据，如果没有则给默认空数组
    const chartData = stats.value.charts.activity || { dates: [], counts: [] }
    
    return {
      tooltip: { trigger: 'axis' },
      grid: { top: '10%', left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { 
        type: 'category', 
        boundaryGap: false, 
        // 🔥 X轴: 日期
        data: chartData.dates 
      },
      yAxis: { type: 'value', minInterval: 1 }, // minInterval:1 保证Y轴不显示小数
      series: [
        {
          name: '活跃会话',
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.1, color: '#3b82f6' },
          lineStyle: { color: '#3b82f6' },
          // 🔥 Y轴: 数量
          data: chartData.counts
        }
      ]
    }
  })
  </script>
  
  <style scoped>
  .chart {
    height: 100%;
    width: 100%;
  }
  </style>