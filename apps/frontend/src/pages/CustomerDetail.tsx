import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  Building, 
  Calendar, 
  MapPin,
  Edit,
  ArrowLeft,
} from 'lucide-react';
import { CustomerInteractions } from '@/components/CustomerInteractions';

// Mock customer data - replace with actual API call
const mockCustomer = {
  phone: '0912345678',
  name: '王小明',
  email: 'wang@example.com',
  company: 'ABC 公司',
  address: '台北市信義區信義路五段7號',
  birthday: '1990-05-15',
  source: 'REFERRAL',
  status: 'ACTIVE',
  tags: ['VIP', '企業客戶'],
  notes: '重要客戶，需特別關照',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-08-21T00:00:00Z',
};

const CustomerDetail: React.FC = () => {
  const { phone } = useParams<{ phone: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'interactions' | 'orders'>('overview');
  
  // Mock loading state - replace with actual loading from API
  const isLoading = false;
  const customer = mockCustomer;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">找不到客戶</h2>
        <p className="text-gray-600">請檢查客戶電話號碼是否正確</p>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: '基本資料' },
    { key: 'interactions', label: '交流紀錄' },
    { key: 'orders', label: '訂單記錄' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-sm text-gray-500">{customer.phone}</p>
          </div>
        </div>
        <button className="btn btn-primary">
          <Edit className="w-4 h-4 mr-2" />
          編輯客戶
        </button>
      </div>

      {/* Customer Info Card */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">電話</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            </div>

            {customer.email && (
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">電子郵件</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
            )}

            {(customer.email || customer.phone || "無公司資訊") && (
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">公司</p>
                  <p className="font-medium">{(customer.email || customer.phone || "無公司資訊")}</p>
                </div>
              </div>
            )}

            {(customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "未設定") && (
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">生日</p>
                  <p className="font-medium">{new Date((customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "未設定")).toLocaleDateString('zh-TW')}</p>
                </div>
              </div>
            )}

            {(customer.region || "地址未設定") && (
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">地址</p>
                  <p className="font-medium">{(customer.region || "地址未設定")}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">狀態</p>
                <span className={`badge ${
                  (customer.email ? "ACTIVE" : "INACTIVE") === 'ACTIVE' ? 'badge-success' :
                  (customer.email ? "ACTIVE" : "INACTIVE") === 'INACTIVE' ? 'badge-gray' :
                  (customer.email ? "ACTIVE" : "INACTIVE") === 'POTENTIAL' ? 'badge-warning' :
                  'badge-error'
                }`}>
                  {(customer.email ? "ACTIVE" : "INACTIVE") === 'ACTIVE' ? '活躍' :
                   (customer.email ? "ACTIVE" : "INACTIVE") === 'INACTIVE' ? '不活躍' :
                   (customer.email ? "ACTIVE" : "INACTIVE") === 'POTENTIAL' ? '潛在' : '黑名單'}
                </span>
              </div>
            </div>
          </div>

          {customer.tags && customer.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">標籤</p>
              <div className="flex flex-wrap gap-2">
                {customer.tags.map((tag, index) => (
                  <span key={index} className="badge badge-primary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {customer.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">備註</p>
              <p className="text-gray-900">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">客戶統計</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-600">12</p>
                  <p className="text-sm text-gray-500">總訂單數</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-success-600">$45,680</p>
                  <p className="text-sm text-gray-500">總消費金額</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-warning-600">8</p>
                  <p className="text-sm text-gray-500">交流紀錄數</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interactions' && phone && (
          <CustomerInteractions customerPhone={phone} />
        )}

        {activeTab === 'orders' && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">訂單記錄</h3>
            </div>
            <div className="card-body">
              <p className="text-gray-500 text-center py-8">訂單記錄功能開發中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;