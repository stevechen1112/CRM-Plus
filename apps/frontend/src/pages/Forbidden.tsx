import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Forbidden: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Error Code */}
        <div>
          <h1 className="text-9xl font-bold text-red-500">403</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4">
            存取被拒絕
          </h2>
          <p className="text-gray-600 mt-4">
            抱歉，您沒有權限存取此頁面。
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              目前身份：<span className="font-medium">{user.name}</span> ({user.role})
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={goBack}
            className="w-full btn btn-primary"
          >
            返回上一頁
          </button>
          <Link
            to="/dashboard"
            className="block w-full btn btn-outline"
          >
            回到首頁
          </Link>
        </div>

        {/* Contact Info */}
        <div className="text-sm text-gray-500">
          <p>如果您認為這是錯誤，請聯繫系統管理員</p>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;