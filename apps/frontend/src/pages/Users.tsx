import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Edit2,
  Key,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

import { usersService, CreateUserRequest, UpdateUserRequest, UsersQuery } from '@/services/users';
import { User } from '@crm/shared';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  TableList, 
  FormModal, 
  useConfirmDialog, 
  LoadingSpinner,
  PermissionGate 
} from '@/components/common';
import type { TableColumn, TableAction } from '@/components/common';

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(1, '姓名不能為空'),
  email: z.string().email('請輸入有效的電子郵件地址'),
  password: z.string().min(6, '密碼至少需要6個字符'),
  confirmPassword: z.string().min(6, '確認密碼至少需要6個字符'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
  isActive: z.boolean().default(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: '密碼與確認密碼不符',
  path: ['confirmPassword'],
});

const updateUserSchema = z.object({
  name: z.string().min(1, '姓名不能為空'),
  email: z.string().email('請輸入有效的電子郵件地址'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
  isActive: z.boolean(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, '新密碼至少需要6個字符'),
  confirmPassword: z.string().min(6, '確認密碼至少需要6個字符'),
  confirmEmail: z.string().email('請輸入使用者的電子郵件地址進行確認'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '密碼與確認密碼不符',
  path: ['confirmPassword'],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  
  // State
  const [query, setQuery] = useState<UsersQuery>({
    page: 1,
    limit: 10,
    query: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Confirm dialogs
  const deleteConfirm = useConfirmDialog();
  const revokeSessionsConfirm = useConfirmDialog();

  // Queries and mutations
  const usersQuery = useQuery({
    queryKey: ['users', query],
    queryFn: () => usersService.getUsers(query),
    enabled: can('users.view'),
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserRequest) => usersService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      toast.success('使用者建立成功，此操作已記錄於 AuditLog');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '建立使用者失敗');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...userData }: UpdateUserRequest & { id: string }) => 
      usersService.updateUser(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowEditModal(false);
      setSelectedUser(null);
      toast.success('使用者更新成功，此操作已記錄於 AuditLog');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新使用者失敗');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      usersService.resetPassword(id, newPassword),
    onSuccess: () => {
      setShowResetPasswordModal(false);
      setSelectedUser(null);
      toast.success('密碼重設成功，此操作已記錄於 AuditLog');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '重設密碼失敗');
    },
  });

  const revokeSessionsMutation = useMutation({
    mutationFn: (id: string) => usersService.revokeAllSessions(id),
    onSuccess: () => {
      toast.success('使用者已被強制登出，此操作已記錄於 AuditLog');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '強制登出失敗');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('使用者刪除成功，此操作已記錄於 AuditLog');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '刪除使用者失敗');
    },
  });

  // Forms
  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'STAFF',
      isActive: true,
    },
  });

  const updateForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Event handlers
  const handleSearch = useCallback((searchTerm: string) => {
    setQuery(prev => ({ ...prev, query: searchTerm, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setQuery(prev => ({ ...prev, page }));
  }, []);

  const handleCreateUser = (data: CreateUserFormData) => {
    const { confirmPassword, ...userData } = data;
    createUserMutation.mutate(userData);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    updateForm.reset({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'STAFF',
      isActive: user?.isActive || false,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = (data: UpdateUserFormData) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ ...data, id: selectedUser.id });
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    resetPasswordForm.reset({
      newPassword: '',
      confirmPassword: '',
      confirmEmail: '',
    });
    setShowResetPasswordModal(true);
  };

  const handleResetPasswordSubmit = (data: ResetPasswordFormData) => {
    if (!selectedUser) return;
    
    if (data.confirmEmail !== selectedUser.email) {
      toast.error('確認電子郵件地址不正確');
      return;
    }

    resetPasswordMutation.mutate({
      id: selectedUser.id,
      newPassword: data.newPassword,
    });
  };

  const handleRevokeAllSessions = async (user: User) => {
    await revokeSessionsConfirm.showConfirm({
      title: '強制登出使用者',
      description: `確定要將使用者「${user?.name || '未知使用者'}」強制登出嗎？這會立即撤銷所有該使用者的登入狀態。`,
      confirmText: '確認登出',
      cancelText: '取消',
      type: 'warning',
      onConfirm: () => revokeSessionsMutation.mutate(user?.id || ''),
    });
  };

  const handleDeleteUser = async (user: User) => {
    await deleteConfirm.showConfirm({
      title: '刪除使用者',
      description: `確定要刪除使用者「${user?.name || '未知使用者'}」嗎？此操作無法復原。`,
      confirmText: '確認刪除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: () => deleteUserMutation.mutate(user?.id || ''),
    });
  };

  // Table configuration
  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      title: '姓名',
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">{user?.name || '未知使用者'}</div>
          <div className="text-sm text-gray-500">{user?.email || '無信箱'}</div>
        </div>
      ),
    },
    {
      key: 'role',
      title: '角色',
      render: (user) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            (user?.role || 'STAFF') === 'ADMIN'
              ? 'bg-red-100 text-red-800'
              : (user?.role || 'STAFF') === 'MANAGER'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {(user?.role || 'STAFF') === 'ADMIN' ? '管理員' : (user?.role || 'STAFF') === 'MANAGER' ? '經理' : '職員'}
        </span>
      ),
    },
    {
      key: 'isActive',
      title: '狀態',
      render: (user) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            (user?.isActive || false)
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {(user?.isActive || false) ? '啟用' : '停用'}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      title: '上次登入',
      render: (user) => (
        <div className="text-sm text-gray-900">
          {(user?.lastLoginAt || user?.createdAt) ? new Date((user.lastLoginAt || user.createdAt)).toLocaleString('zh-TW') : '從未登入'}
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: '建立時間',
      render: (user) => (
        <div className="text-sm text-gray-900">
          {user?.createdAt ? new Date(user.createdAt).toLocaleString('zh-TW') : '未知日期'}
        </div>
      ),
    },
  ];

  const actions: TableAction<User>[] = [
    {
      label: '編輯',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: handleEditUser,
      show: () => can('users.edit'),
    },
    {
      label: '重設密碼',
      icon: <Key className="w-4 h-4" />,
      onClick: handleResetPassword,
      show: () => can('users.reset_password'),
    },
    {
      label: '強制登出',
      icon: <LogOut className="w-4 h-4" />,
      onClick: handleRevokeAllSessions,
      show: () => can('users.revoke_sessions'),
    },
    {
      label: '刪除',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDeleteUser,
      variant: 'danger',
      show: () => can('users.delete'),
    },
  ];

  // Loading state
  if (usersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">使用者管理</h1>
          <p className="text-sm text-gray-600">管理系統使用者帳號與權限</p>
        </div>
        
        <PermissionGate requiredRoles={['ADMIN']}>
          <button
            onClick={() => {
              createForm.reset();
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
            disabled={createUserMutation.isPending}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            新增使用者
          </button>
        </PermissionGate>
      </div>

      {/* Users Table */}
      <TableList
        data={usersQuery.data?.users || []}
        columns={columns}
        rowActions={actions}
        searchable
        onSearch={handleSearch}
        searchPlaceholder="搜尋使用者姓名或電子郵件..."
        pagination={{
          current: query.page || 1,
          total: usersQuery.data?.totalPages || 0,
          pageSize: query.limit || 10,
          onPageChange: (page: number) => handlePageChange(page),
        }}
        loading={usersQuery.isLoading}
        emptyText="尚無使用者資料"
      />

      {/* Create User Modal */}
      <FormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新增使用者"
        onSubmit={createForm.handleSubmit(handleCreateUser)}
        confirmLoading={createUserMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              {...createForm.register('name')}
              className="form-input"
              placeholder="請輸入使用者姓名"
            />
            {createForm.formState.errors.name && (
              <p className="form-error">{createForm.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電子郵件 <span className="text-red-500">*</span>
            </label>
            <input
              {...createForm.register('email')}
              type="email"
              className="form-input"
              placeholder="請輸入電子郵件地址"
            />
            {createForm.formState.errors.email && (
              <p className="form-error">{createForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密碼 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...createForm.register('password')}
                type={showPassword ? 'text' : 'password'}
                className="form-input pr-10"
                placeholder="請輸入密碼"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            {createForm.formState.errors.password && (
              <p className="form-error">{createForm.formState.errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              確認密碼 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...createForm.register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input pr-10"
                placeholder="請再次輸入密碼"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            {createForm.formState.errors.confirmPassword && (
              <p className="form-error">{createForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              角色 <span className="text-red-500">*</span>
            </label>
            <select {...createForm.register('role')} className="form-select">
              <option value="STAFF">職員</option>
              <option value="MANAGER">經理</option>
              <option value="ADMIN">管理員</option>
            </select>
            {createForm.formState.errors.role && (
              <p className="form-error">{createForm.formState.errors.role.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              {...createForm.register('isActive')}
              type="checkbox"
              className="form-checkbox"
            />
            <label className="ml-2 text-sm text-gray-700">啟用帳號</label>
          </div>
        </div>
      </FormModal>

      {/* Edit User Modal */}
      <FormModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="編輯使用者"
        onSubmit={updateForm.handleSubmit(handleUpdateUser)}
        confirmLoading={updateUserMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              {...updateForm.register('name')}
              className="form-input"
              placeholder="請輸入使用者姓名"
            />
            {updateForm.formState.errors.name && (
              <p className="form-error">{updateForm.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電子郵件 <span className="text-red-500">*</span>
            </label>
            <input
              {...updateForm.register('email')}
              type="email"
              className="form-input"
              placeholder="請輸入電子郵件地址"
            />
            {updateForm.formState.errors.email && (
              <p className="form-error">{updateForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              角色 <span className="text-red-500">*</span>
            </label>
            <select {...updateForm.register('role')} className="form-select">
              <option value="STAFF">職員</option>
              <option value="MANAGER">經理</option>
              <option value="ADMIN">管理員</option>
            </select>
            {updateForm.formState.errors.role && (
              <p className="form-error">{updateForm.formState.errors.role.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              {...updateForm.register('isActive')}
              type="checkbox"
              className="form-checkbox"
            />
            <label className="ml-2 text-sm text-gray-700">啟用帳號</label>
          </div>
        </div>
      </FormModal>

      {/* Reset Password Modal */}
      <FormModal
        open={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        title="重設使用者密碼"
        onSubmit={resetPasswordForm.handleSubmit(handleResetPasswordSubmit)}
        confirmLoading={resetPasswordMutation.isPending}
        confirmText="重設密碼"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>注意：</strong>重設密碼後，該使用者需要使用新密碼重新登入。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新密碼 <span className="text-red-500">*</span>
            </label>
            <input
              {...resetPasswordForm.register('newPassword')}
              type="password"
              className="form-input"
              placeholder="請輸入新密碼"
            />
            {resetPasswordForm.formState.errors.newPassword && (
              <p className="form-error">{resetPasswordForm.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              確認新密碼 <span className="text-red-500">*</span>
            </label>
            <input
              {...resetPasswordForm.register('confirmPassword')}
              type="password"
              className="form-input"
              placeholder="請再次輸入新密碼"
            />
            {resetPasswordForm.formState.errors.confirmPassword && (
              <p className="form-error">{resetPasswordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              確認操作：請輸入使用者的電子郵件地址 <span className="text-red-500">*</span>
            </label>
            <input
              {...resetPasswordForm.register('confirmEmail')}
              type="email"
              className="form-input"
              placeholder={`請輸入 ${selectedUser?.email || ''} 以確認`}
            />
            {resetPasswordForm.formState.errors.confirmEmail && (
              <p className="form-error">{resetPasswordForm.formState.errors.confirmEmail.message}</p>
            )}
          </div>
        </div>
      </FormModal>

      {/* Confirm Dialogs */}
      <deleteConfirm.ConfirmDialog />
      <revokeSessionsConfirm.ConfirmDialog />
    </div>
  );
};

export default Users;