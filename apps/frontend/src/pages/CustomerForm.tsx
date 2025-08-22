import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, Mail, Building, MapPin } from 'lucide-react';
import { useSuccessToast, useErrorToast } from '@/components/common';

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  company: string;
  address: string;
  city: string;
  status: 'ACTIVE' | 'INACTIVE' | 'POTENTIAL' | 'BLACKLISTED';
  source: 'WEBSITE' | 'REFERRAL' | 'COLD_CALL' | 'SOCIAL_MEDIA' | 'ADVERTISEMENT';
  notes: string;
}

const CustomerForm: React.FC = () => {
  const { phone } = useParams<{ phone: string }>();
  const navigate = useNavigate();
  const isEdit = phone && phone !== 'add';
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    city: '',
    status: 'POTENTIAL',
    source: 'WEBSITE',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (isEdit && phone) {
      // 模擬載入現有客戶資料
      const mockCustomer = {
        name: '王小明',
        phone: phone,
        email: 'wang@example.com',
        company: 'ABC 公司',
        address: '台北市信義區信義路五段7號',
        city: '台北',
        status: 'ACTIVE' as const,
        source: 'REFERRAL' as const,
        notes: '重要客戶，需特別關照'
      };
      setFormData(mockCustomer);
    }
  }, [isEdit, phone]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除該欄位的錯誤
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '客戶姓名為必填欄位';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = '電話號碼為必填欄位';
    } else if (!/^09\d{8}$/.test(formData.phone)) {
      newErrors.phone = '請輸入有效的台灣手機號碼（格式：09XXXXXXXX）';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件地址';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // 模擬 API 呼叫
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isEdit) {
        showSuccess('更新成功', `客戶 ${formData.name} 的資料已成功更新`);
      } else {
        showSuccess('新增成功', `客戶 ${formData.name} 已成功新增到系統`);
      }
      
      navigate('/customers');
    } catch (error) {
      showError('操作失敗', '無法儲存客戶資料，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? '編輯客戶' : '新增客戶'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEdit ? `編輯客戶 ${phone} 的資料` : '新增客戶到系統中'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2" />
              基本資料
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  客戶姓名 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input ${
                    errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="請輸入客戶姓名"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話號碼 *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`form-input pl-10 ${
                      errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder="09XXXXXXXX"
                    required
                    disabled={isEdit}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電子郵件
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-input pl-10 ${
                      errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder="example@company.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  公司名稱
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    placeholder="請輸入公司名稱"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  聯絡地址
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    placeholder="請輸入完整地址"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  城市
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">請選擇城市</option>
                  <option value="台北">台北</option>
                  <option value="新北">新北</option>
                  <option value="桃園">桃園</option>
                  <option value="台中">台中</option>
                  <option value="台南">台南</option>
                  <option value="高雄">高雄</option>
                  <option value="其他">其他</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">客戶狀態</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  客戶狀態
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="POTENTIAL">潛在客戶</option>
                  <option value="ACTIVE">活躍客戶</option>
                  <option value="INACTIVE">不活躍</option>
                  <option value="BLACKLISTED">黑名單</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  客戶來源
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="WEBSITE">官網</option>
                  <option value="REFERRAL">推薦</option>
                  <option value="COLD_CALL">陌生開發</option>
                  <option value="SOCIAL_MEDIA">社群媒體</option>
                  <option value="ADVERTISEMENT">廣告</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備註
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-textarea"
                  placeholder="客戶相關備註資訊..."
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="btn btn-secondary"
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isEdit ? '更新中...' : '新增中...'}
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="w-4 h-4 mr-2" />
                {isEdit ? '更新客戶' : '新增客戶'}
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;