import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, Eye, Edit, Trash2, Search, Filter, Upload, Download } from 'lucide-react';
import { useCustomerExport } from '@/hooks/useImportExport';
import { 
  TableList, 
  type TableColumn, 
  type TableAction,
  useSuccessToast,
  useErrorToast,
  useInfoToast,
  PermissionGate
} from '@/components/common';
import { useConfirmDialog } from '@/components/common';
import { usePermissions } from '@/hooks/usePermissions';

interface Customer {
  phone: string;
  name: string;
  email: string;
  company: string;
  status: 'ACTIVE' | 'INACTIVE' | 'POTENTIAL' | 'BLACKLISTED';
  source: 'WEBSITE' | 'REFERRAL' | 'COLD_CALL' | 'SOCIAL_MEDIA' | 'ADVERTISEMENT';
  createdAt: string;
}

// Mock customer data
const mockCustomers: Customer[] = [
  {
    phone: '0912345678',
    name: '王小明',
    email: 'wang@example.com',
    company: 'ABC 公司',
    status: 'ACTIVE',
    source: 'REFERRAL',
    createdAt: '2024-01-15',
  },
  {
    phone: '0987654321',
    name: '李大華',
    email: 'li@example.com',
    company: 'XYZ 企業',
    status: 'POTENTIAL',
    source: 'WEBSITE',
    createdAt: '2024-02-20',
  },
  {
    phone: '0923456789',
    name: '陳美玲',
    email: 'chen@example.com',
    company: '台灣科技',
    status: 'ACTIVE',
    source: 'ADVERTISEMENT',
    createdAt: '2024-03-10',
  },
  {
    phone: '0934567890',
    name: '林志明',
    email: 'lin@example.com',
    company: '創新企業',
    status: 'INACTIVE',
    source: 'COLD_CALL',
    createdAt: '2024-02-28',
  },
];

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { showConfirm } = useConfirmDialog();
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();
  const showInfo = useInfoToast();
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    source: '',
    city: '',
    hasOrders: undefined,
    hasInteractions: undefined
  });
  const [loading] = useState(false);
  
  const exportMutation = useCustomerExport();

  const handleExport = () => {
    const query = {
      ...filters,
      hasOrders: filters.hasOrders === 'true' ? true : filters.hasOrders === 'false' ? false : undefined,
      hasInteractions: filters.hasInteractions === 'true' ? true : filters.hasInteractions === 'false' ? false : undefined
    };
    
    showInfo('開始匯出', '正在準備客戶資料...');
    exportMutation.mutate(query, {
      onSuccess: () => {
        showSuccess('匯出成功', '客戶資料已成功匯出為 CSV 檔案');
      },
      onError: (error: any) => {
        showError('匯出失敗', error?.message || '無法匯出客戶資料，請稍後再試');
      }
    });
  };

  const handleEdit = (customer: Customer) => {
    showInfo('載入編輯頁面', `正在編輯客戶 ${customer?.name || '未知客戶'} 的資料...`);
    navigate(`/customers/${customer?.phone || 'unknown'}/edit`);
  };

  const handleAddCustomer = () => {
    showInfo('新增客戶', '正在開啟新增客戶表單...');
    // TODO: 導航到新增客戶頁面或開啟 Modal
    navigate('/customers/add');
  };

  const handleDelete = async (customer: Customer) => {
    await showConfirm({
      title: '刪除客戶',
      description: `確定要刪除客戶 ${customer?.name || '未知客戶'} 嗎？此操作無法復原。`,
      type: 'danger',
      confirmText: '刪除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          // TODO: 实现删除逻辑 - 调用删除 API
          console.log('删除客户:', customer?.phone || 'unknown');
          
          // 模拟 API 调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          showSuccess('刪除成功', `已成功刪除客戶 ${customer?.name || '未知客戶'}`);
          // TODO: 重新獲取客戶列表
        } catch (error: any) {
          showError('刪除失敗', error?.message || '無法刪除客戶，請稍後再試');
          throw error; // Re-throw to keep dialog open on error
        }
      }
    });
  };

  const getStatusText = (status: Customer['status']) => {
    const statusMap = {
      ACTIVE: '活躍',
      INACTIVE: '不活躍', 
      POTENTIAL: '潛在',
      BLACKLISTED: '黑名單'
    };
    return statusMap[status];
  };

  const getStatusBadgeClass = (status: Customer['status']) => {
    const classMap = {
      ACTIVE: 'badge-success',
      INACTIVE: 'badge-gray',
      POTENTIAL: 'badge-warning',
      BLACKLISTED: 'badge-error'
    };
    return classMap[status];
  };

  const getSourceText = (source: Customer['source']) => {
    const sourceMap = {
      REFERRAL: '推薦',
      WEBSITE: '網站',
      SOCIAL_MEDIA: '社群',
      ADVERTISEMENT: '廣告',
      COLD_CALL: '陌生開發'
    };
    return sourceMap[source];
  };

  // Filter customers based on search term
  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = !searchTerm || 
      (customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer?.phone || '').includes(searchTerm) ||
      (customer?.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSource = !filters.source || customer?.source === filters.source;
    
    return matchesSearch && matchesSource;
  });

  // Define table columns
  const columns: TableColumn<Customer>[] = [
    {
      key: 'customer',
      title: '客戶資訊',
      render: (customer) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{customer?.name || '未知客戶'}</p>
            <p className="text-sm text-gray-500">{customer?.email || customer?.phone || '無聯絡資訊'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      title: '聯絡方式',
      render: (customer) => (
        <div>
          <p className="text-gray-900">{customer?.phone || '無電話'}</p>
          <p className="text-sm text-gray-500">{customer?.email || '無信箱'}</p>
        </div>
      )
    },
    {
      key: 'status',
      title: '狀態',
      render: (customer) => {
        // 基於現有數據推導狀態
        const status = customer?.email ? 'ACTIVE' : 'INACTIVE';
        return (
          <span className={`badge ${getStatusBadgeClass(status)}`}>
            {getStatusText(status)}
          </span>
        );
      }
    },
    {
      key: 'source',
      title: '來源',
      render: (customer) => (
        <span className="text-gray-900">{getSourceText(customer?.source)}</span>
      )
    },
    {
      key: 'createdAt',
      title: '加入日期',
      render: (customer) => (
        <span className="text-gray-500">
          {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('zh-TW') : '未知日期'}
        </span>
      )
    },
  ];

  // Define table actions
  const actions: TableAction<Customer>[] = [
    {
      label: '查看',
      icon: <Eye className="w-4 h-4" />,
      onClick: (customer) => navigate(`/customers/${customer?.phone || 'unknown'}`),
      variant: 'ghost'
    },
    {
      label: '編輯',
      icon: <Edit className="w-4 h-4" />,
      onClick: handleEdit,
      variant: 'ghost',
      show: () => can('customers.edit')
    },
    {
      label: '刪除',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      variant: 'ghost',
      className: 'text-error-600 hover:text-error-700',
      show: () => can('customers.delete')
    },
  ];

  // Mobile card render function
  const renderMobileCard = (customer: Customer) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{customer?.name || '未知客戶'}</h3>
            <p className="text-sm text-gray-500">{customer?.email || customer?.phone || '無聯絡資訊'}</p>
          </div>
        </div>
        <span className={`badge ${getStatusBadgeClass(customer?.email ? 'ACTIVE' : 'INACTIVE')}`}>
          {getStatusText(customer?.email ? 'ACTIVE' : 'INACTIVE')}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">電話:</span>
          <span className="text-gray-900">{customer?.phone || '無電話'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">電郵:</span>
          <span className="text-gray-900 truncate ml-2">{customer?.email || '無信箱'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">來源:</span>
          <span className="text-gray-900">{getSourceText(customer?.source)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">加入:</span>
          <span className="text-gray-900">
            {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('zh-TW') : '未知日期'}
          </span>
        </div>
      </div>
      
      <div className="flex space-x-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => navigate(`/customers/${customer?.phone || 'unknown'}`)}
          className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          查看
        </button>
        {can('customers.edit') && (
          <button
            onClick={() => handleEdit(customer)}
            className="flex-1 px-3 py-1.5 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
          >
            編輯
          </button>
        )}
        {can('customers.delete') && (
          <button
            onClick={() => handleDelete(customer)}
            className="flex-1 px-3 py-1.5 text-xs bg-error-100 text-error-700 rounded hover:bg-error-200 transition-colors"
          >
            刪除
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">客戶管理</h1>
          <p className="text-gray-600">管理您的客戶資料和關係</p>
        </div>
        <div className="flex space-x-3">
          <PermissionGate requiredPermissions={['import.export']}>
            <Link to="/import" className="btn btn-secondary">
              <Upload className="w-4 h-4 mr-2" />
              匯入資料
            </Link>
          </PermissionGate>
          <PermissionGate requiredPermissions={['customers.export']}>
            <button 
              onClick={handleExport}
              disabled={exportMutation.isLoading}
              className="btn btn-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              {exportMutation.isLoading ? '匯出中...' : '匯出 CSV'}
            </button>
          </PermissionGate>
          <PermissionGate requiredPermissions={['customers.create']}>
            <button className="btn btn-primary" onClick={handleAddCustomer}>
              <Plus className="w-4 h-4 mr-2" />
              新增客戶
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜尋客戶姓名、電話或公司..."
                  className="pl-10 form-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                className="form-select"
                value={filters.source}
                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              >
                <option value="">所有來源</option>
                <option value="WEBSITE">官網</option>
                <option value="REFERRAL">推薦</option>
                <option value="COLD_CALL">陌生開發</option>
                <option value="SOCIAL_MEDIA">社群媒體</option>
                <option value="ADVERTISEMENT">廣告</option>
              </select>
              <select 
                className="form-select"
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              >
                <option value="">所有城市</option>
                <option value="台北">台北</option>
                <option value="新北">新北</option>
                <option value="台中">台中</option>
                <option value="高雄">高雄</option>
              </select>
              <button className="btn btn-secondary">
                <Filter className="w-4 h-4 mr-2" />
                篩選
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <TableList
        data={filteredCustomers}
        columns={columns}
        rowActions={actions}
        loading={loading}
        rowKey={(customer: Customer) => customer?.phone || 'unknown'}
        mobileCardRender={renderMobileCard}
        emptyText="沒有找到客戶資料"
        pagination={{
          current: 1,
          pageSize: 10,
          total: filteredCustomers.length,
          showSizeChanger: true,
          onPageChange: (page, pageSize) => console.log('Page changed:', page, pageSize)
        }}
        />
      </div>
    </div>
  );
};

export default Customers;