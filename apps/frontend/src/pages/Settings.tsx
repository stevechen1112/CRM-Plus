import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Globe,
  Database,
  Mail,
  Smartphone,
  Lock,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useSuccessToast, useErrorToast } from '@/components/common';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();
  
  const [settings, setSettings] = useState({
    general: {
      companyName: 'ABC 企業',
      companyEmail: 'contact@abc.com',
      companyPhone: '02-1234-5678',
      timezone: 'Asia/Taipei',
      language: 'zh-TW',
      currency: 'TWD'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      taskReminders: true,
      systemAlerts: true,
      customerUpdates: true
    },
    security: {
      passwordPolicy: 'medium',
      sessionTimeout: 30,
      twoFactorAuth: false,
      loginAttempts: 5,
      auditLogging: true
    },
    integrations: {
      emailProvider: 'smtp',
      smsProvider: 'none',
      backupEnabled: true,
      apiAccess: true
    }
  });
  
  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };
  
  const handleSave = async () => {
    setLoading(true);
    try {
      // 模擬 API 呼叫
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('設定已儲存', '系統設定已成功更新');
    } catch (error) {
      showError('儲存失敗', '無法儲存設定，請稍後再試');
    } finally {
      setLoading(false);
    }
  };
  
  const tabs = [
    { id: 'general', name: '一般設定', icon: SettingsIcon },
    { id: 'notifications', name: '通知設定', icon: Bell },
    { id: 'security', name: '安全設定', icon: Shield },
    { id: 'integrations', name: '整合設定', icon: Globe }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">系統設定</h1>
        <p className="text-gray-600">管理系統配置和個人偏好設定</p>
      </div>
      
      {/* Tabs */}
      <div className="card">
        <div className="card-body p-0">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    公司資訊
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        公司名稱
                      </label>
                      <input
                        type="text"
                        value={settings.general.companyName}
                        onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        公司信箱
                      </label>
                      <input
                        type="email"
                        value={settings.general.companyEmail}
                        onChange={(e) => handleSettingChange('general', 'companyEmail', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        公司電話
                      </label>
                      <input
                        type="tel"
                        value={settings.general.companyPhone}
                        onChange={(e) => handleSettingChange('general', 'companyPhone', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        時區
                      </label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                        className="form-select"
                      >
                        <option value="Asia/Taipei">台北 (UTC+8)</option>
                        <option value="Asia/Shanghai">上海 (UTC+8)</option>
                        <option value="Asia/Tokyo">東京 (UTC+9)</option>
                        <option value="UTC">UTC (UTC+0)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        系統語言
                      </label>
                      <select
                        value={settings.general.language}
                        onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                        className="form-select"
                      >
                        <option value="zh-TW">繁體中文</option>
                        <option value="zh-CN">简体中文</option>
                        <option value="en-US">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        貨幣單位
                      </label>
                      <select
                        value={settings.general.currency}
                        onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                        className="form-select"
                      >
                        <option value="TWD">台幣 (TWD)</option>
                        <option value="USD">美金 (USD)</option>
                        <option value="CNY">人民幣 (CNY)</option>
                        <option value="JPY">日圓 (JPY)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    通知偏好
                  </h3>
                  <div className="space-y-4">
                    {[
                      { key: 'emailNotifications', label: '郵件通知', icon: Mail, desc: '接收系統重要通知郵件' },
                      { key: 'smsNotifications', label: 'SMS 通知', icon: Smartphone, desc: '接收緊急事件簡訊通知' },
                      { key: 'taskReminders', label: '任務提醒', icon: AlertCircle, desc: '任務到期前自動提醒' },
                      { key: 'systemAlerts', label: '系統警示', icon: RefreshCw, desc: '系統狀態和錯誤通知' },
                      { key: 'customerUpdates', label: '客戶更新', icon: User, desc: '客戶資料變更通知' }
                    ].map((setting) => {
                      const Icon = setting.icon;
                      return (
                        <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Icon className="w-5 h-5 text-gray-400" />
                            <div>
                              <h4 className="font-medium text-gray-900">{setting.label}</h4>
                              <p className="text-sm text-gray-500">{setting.desc}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications[setting.key as keyof typeof settings.notifications]}
                              onChange={(e) => handleSettingChange('notifications', setting.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    安全性設定
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          密碼政策
                        </label>
                        <select
                          value={settings.security.passwordPolicy}
                          onChange={(e) => handleSettingChange('security', 'passwordPolicy', e.target.value)}
                          className="form-select"
                        >
                          <option value="low">低強度 (8位數字母)</option>
                          <option value="medium">中強度 (8位含特殊符號)</option>
                          <option value="high">高強度 (12位含大小寫)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          會話逾時 (分鐘)
                        </label>
                        <select
                          value={settings.security.sessionTimeout}
                          onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                          className="form-select"
                        >
                          <option value={15}>15 分鐘</option>
                          <option value={30}>30 分鐘</option>
                          <option value={60}>1 小時</option>
                          <option value={240}>4 小時</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          最大登入嘗試次數
                        </label>
                        <select
                          value={settings.security.loginAttempts}
                          onChange={(e) => handleSettingChange('security', 'loginAttempts', parseInt(e.target.value))}
                          className="form-select"
                        >
                          <option value={3}>3 次</option>
                          <option value={5}>5 次</option>
                          <option value={10}>10 次</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        { key: 'twoFactorAuth', label: '雙因子驗證', desc: '使用手機應用程式進行額外驗證' },
                        { key: 'auditLogging', label: '稽核日誌', desc: '記錄所有系統操作活動' }
                      ].map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Lock className="w-5 h-5 text-gray-400" />
                            <div>
                              <h4 className="font-medium text-gray-900">{setting.label}</h4>
                              <p className="text-sm text-gray-500">{setting.desc}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.security[setting.key as keyof typeof settings.security]}
                              onChange={(e) => handleSettingChange('security', setting.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Integrations Settings */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    第三方整合
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        郵件服務提供商
                      </label>
                      <select
                        value={settings.integrations.emailProvider}
                        onChange={(e) => handleSettingChange('integrations', 'emailProvider', e.target.value)}
                        className="form-select"
                      >
                        <option value="smtp">SMTP 伺服器</option>
                        <option value="sendgrid">SendGrid</option>
                        <option value="mailgun">Mailgun</option>
                        <option value="ses">Amazon SES</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        簡訊服務提供商
                      </label>
                      <select
                        value={settings.integrations.smsProvider}
                        onChange={(e) => handleSettingChange('integrations', 'smsProvider', e.target.value)}
                        className="form-select"
                      >
                        <option value="none">未設定</option>
                        <option value="twilio">Twilio</option>
                        <option value="nexmo">Nexmo</option>
                        <option value="mitake">三竹簡訊</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-6">
                    {[
                      { key: 'backupEnabled', label: '自動備份', icon: Database, desc: '每日自動備份系統數據' },
                      { key: 'apiAccess', label: 'API 存取', icon: Globe, desc: '允許第三方應用存取 API' }
                    ].map((setting) => {
                      const Icon = setting.icon;
                      return (
                        <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Icon className="w-5 h-5 text-gray-400" />
                            <div>
                              <h4 className="font-medium text-gray-900">{setting.label}</h4>
                              <p className="text-sm text-gray-500">{setting.desc}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.integrations[setting.key as keyof typeof settings.integrations]}
                              onChange={(e) => handleSettingChange('integrations', setting.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    儲存中...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    儲存設定
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;