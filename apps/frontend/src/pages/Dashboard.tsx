import React, { useState, useMemo } from 'react';
import {
  Users,
  ShoppingBag,
  MessageCircle,
  CheckSquare,
  TrendingUp,
  DollarSign,
  Phone,
  Target
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import { ChartCard, StatsCard, DateRangeSelector } from '@/components/charts';
import { useCustomerStats, useOrderStats, useInteractionStats, useTaskStats } from '@/hooks/useStats';
import { useErrorToast } from '@/components/common';
import type { DateRange } from '@/types/stats';

// 圖表顏色配置
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#6366F1',
  gray: '#6B7280'
};

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6', '#EC4899'];

// 標籤轉換函數 - 移到組件外避免重複創建
function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    WEBSITE: '官網',
    REFERRAL: '推薦',
    COLD_CALL: '陌生開發',
    SOCIAL_MEDIA: '社群媒體',
    ADVERTISEMENT: '廣告'
  };
  return labels[source] || source;
}

function getChannelLabel(channel: string): string {
  const labels: Record<string, string> = {
    PHONE: '電話',
    EMAIL: '電子郵件',
    LINE: 'LINE',
    FACEBOOK: 'Facebook',
    MEETING: '面談',
    OTHER: '其他'
  };
  return labels[channel] || channel;
}

function getTaskStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: '待處理',
    IN_PROGRESS: '進行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  };
  return labels[status] || status;
}

// 預設日期區間計算函數
const defaultRange = (): DateRange => {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 3);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  };
};

const Dashboard: React.FC = () => {
  const showError = useErrorToast();
  // 只在初次 render 設定，避免每次都重新計算
  const [dateRange, setDateRange] = useState<DateRange>(() => defaultRange());

  // 數據查詢
  const { data: customerStats, isLoading: customerLoading, error: customerError } = useCustomerStats(dateRange);
  const { data: orderStats, isLoading: orderLoading, error: orderError } = useOrderStats(dateRange);
  const { data: interactionStats, isLoading: interactionLoading, error: interactionError } = useInteractionStats(dateRange);
  const { data: taskStats, isLoading: taskLoading, error: taskError } = useTaskStats(dateRange);

  // 錯誤處理 - 移除 showError 依賴避免重渲染循環
  React.useEffect(() => {
    if (customerError) showError('載入客戶統計失敗', customerError.message);
    if (orderError) showError('載入訂單統計失敗', orderError.message);
    if (interactionError) showError('載入交流統計失敗', interactionError.message);
    if (taskError) showError('載入任務統計失敗', taskError.message);
  }, [customerError, orderError, interactionError, taskError]);

  // 準備圖表數據 - 使用 useMemo 避免重複計算引起重渲染
  const customerTrendData = useMemo(() => 
    customerStats?.monthlyTrend.map((item) => ({
      name: `${item?.year || 0}-${(item?.month || 0).toString().padStart(2, '0')}`,
      value: item?.count || 0,
      date: item?.date || ''
    })) || [], [customerStats]);

  const revenueTrendData = useMemo(() => 
    orderStats?.monthlyRevenue.map((item) => ({
      name: `${item?.year || 0}-${(item?.month || 0).toString().padStart(2, '0')}`,
      revenue: item?.revenue || 0,
      orders: item?.orderCount || 0,
      date: item?.date || ''
    })) || [], [orderStats]);

  const customerSourceData = useMemo(() => 
    customerStats?.sourceDistribution.map((item) => ({
      name: getSourceLabel(item?.source || 'unknown'),
      value: item?.count || 0,
      percentage: item?.percentage || 0
    })) || [], [customerStats]);

  const cityDistributionData = useMemo(() => 
    customerStats?.cityDistribution.slice(0, 10).map((item) => ({
      name: item?.city || '未指定',
      value: item?.count || 0,
      percentage: item?.percentage || 0
    })) || [], [customerStats]);

  const channelUsageData = useMemo(() => 
    interactionStats?.channelDistribution.map((item) => ({
      name: getChannelLabel(item?.channel || 'unknown'),
      value: item?.count || 0,
      percentage: item?.percentage || 0
    })) || [], [interactionStats]);

  const interactionTrendData = useMemo(() => 
    interactionStats?.dailyTrend.slice(-30).map((item) => ({
      name: format(new Date(item.date), 'MM/dd', { locale: zhTW }),
      value: item.count,
      date: item.date
    })) || [], [interactionStats]);

  const taskStatusData = useMemo(() => 
    taskStats?.statusDistribution.map((item) => ({
      name: getTaskStatusLabel(item.status!),
      value: item.count,
      percentage: item.percentage
    })) || [], [taskStats]);


  // 自訂 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p style={{ color: data.color }}>
            數量: {data.value.toLocaleString()}
          </p>
          <p className="text-gray-600">
            佔比: {data.payload.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題和日期選擇器 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">數據分析儀表板</h1>
          <p className="text-gray-600">即時業務統計與數據分析</p>
        </div>
        
        <div className="lg:max-w-md">
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      {/* 總覽統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="總客戶數"
          value={customerStats?.totalCustomers || 0}
          icon={<Users className="w-5 h-5" />}
          trend="up"
          trendPercentage={12.5}
          subtitle="較上期"
          loading={customerLoading}
        />
        
        <StatsCard
          title="訂單總數"
          value={orderStats?.totalOrders || 0}
          icon={<ShoppingBag className="w-5 h-5" />}
          trend="up"
          trendPercentage={8.3}
          subtitle="較上期"
          loading={orderLoading}
        />
        
        <StatsCard
          title="交流紀錄"
          value={interactionStats?.totalInteractions || 0}
          icon={<MessageCircle className="w-5 h-5" />}
          trend="up"
          trendPercentage={15.2}
          subtitle="較上期"
          loading={interactionLoading}
        />
        
        <StatsCard
          title="待處理任務"
          value={taskStats?.statusDistribution.find((s) => s.status === 'PENDING')?.count || 0}
          icon={<CheckSquare className="w-5 h-5" />}
          trend="down"
          trendPercentage={-5.1}
          subtitle="較上期"
          loading={taskLoading}
        />
      </div>

      {/* 第二排統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="總營收"
          value={`$${(orderStats?.totalRevenue || 0).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          trend="up"
          trendPercentage={22.1}
          subtitle="較上期"
          loading={orderLoading}
        />
        
        <StatsCard
          title="平均訂單金額"
          value={`$${(orderStats?.averageOrderAmount || 0).toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend="up"
          trendPercentage={6.8}
          subtitle="較上期"
          loading={orderLoading}
        />
        
        <StatsCard
          title="任務完成率"
          value={`${taskStats?.completionRate || 0}%`}
          icon={<Target className="w-5 h-5" />}
          trend="up"
          trendPercentage={3.2}
          subtitle="較上期"
          loading={taskLoading}
        />
        
        <StatsCard
          title="平均處理時間"
          value={`${taskStats?.averageProcessingTime || 0}小時`}
          icon={<Phone className="w-5 h-5" />}
          trend="down"
          trendPercentage={-8.5}
          subtitle="較上期"
          loading={taskLoading}
        />
      </div>

      {/* 趨勢圖表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 客戶增長趨勢 */}
        <ChartCard
          title="客戶增長趨勢"
          subtitle="每月新增客戶數量"
          loading={customerLoading}
          error={customerError?.message}
          height={350}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={customerTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#666" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 營收趨勢 */}
        <ChartCard
          title="營收趨勢"
          subtitle="每月成交金額與訂單數量"
          loading={orderLoading}
          error={orderError?.message}
          height={350}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#666" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#666" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="right" 
                dataKey="orders" 
                name="訂單數" 
                fill={COLORS.info}
                opacity={0.7}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="營收"
                stroke={COLORS.success}
                strokeWidth={3}
                dot={{ fill: COLORS.success, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 分佈圖表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 客戶來源分布 */}
        <ChartCard
          title="客戶來源分布"
          subtitle="各管道獲客情況"
          loading={customerLoading}
          error={customerError?.message}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={customerSourceData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {customerSourceData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 城市分布 */}
        <ChartCard
          title="客戶城市分布"
          subtitle="主要城市客戶分布"
          loading={customerLoading}
          error={customerError?.message}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cityDistributionData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#666" />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                stroke="#666"
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={COLORS.warning} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 溝通管道使用率 */}
        <ChartCard
          title="溝通管道使用率"
          subtitle="各溝通方式使用情況"
          loading={interactionLoading}
          error={interactionError?.message}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={channelUsageData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ percentage }) => `${percentage}%`}
                labelLine={false}
              >
                {channelUsageData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 交流趨勢和任務統計 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 近30天交流趨勢 */}
        <ChartCard
          title="交流活動趨勢"
          subtitle="近30天每日交流紀錄"
          loading={interactionLoading}
          error={interactionError?.message}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={interactionTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#666" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                name="交流次數"
                stroke={COLORS.info}
                strokeWidth={2}
                dot={{ fill: COLORS.info, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 任務狀態分布 */}
        <ChartCard
          title="任務執行統計"
          subtitle="各狀態任務分布情況"
          loading={taskLoading}
          error={taskError?.message}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taskStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#666" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;