import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@/test/utils'
import PermissionGate from './PermissionGate'
import { mockUser, mockAdminUser, mockManagerUser } from '@/test/utils'
import * as authHook from '@/hooks/useAuth'
import * as permissionsHook from '@/hooks/usePermissions'

// Mock the hooks
const mockUseAuth = vi.spyOn(authHook, 'useAuth')
const mockUsePermissions = vi.spyOn(permissionsHook, 'usePermissions')

const defaultAuthReturn = {
  user: mockUser,
  hasRole: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  isLoading: false,
}

const defaultPermissionsReturn = {
  can: vi.fn(),
  canAny: vi.fn(),
  canAll: vi.fn(),
  permissions: [],
}

describe('PermissionGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue(defaultAuthReturn)
    mockUsePermissions.mockReturnValue(defaultPermissionsReturn)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基本渲染', () => {
    it('當用戶有權限時應該渲染子組件', () => {
      defaultAuthReturn.hasRole.mockReturnValue(true)
      
      render(
        <PermissionGate requiredRoles={['STAFF']}>
          <div>受保護的內容</div>
        </PermissionGate>
      )
      
      expect(screen.getByText('受保護的內容')).toBeInTheDocument()
    })

    it('當用戶沒有權限時應該渲染 fallback', () => {
      defaultAuthReturn.hasRole.mockReturnValue(false)
      
      render(
        <PermissionGate 
          requiredRoles={['ADMIN']} 
          fallback={<div>無權限訊息</div>}
        >
          <div>受保護的內容</div>
        </PermissionGate>
      )
      
      expect(screen.queryByText('受保護的內容')).not.toBeInTheDocument()
      expect(screen.getByText('無權限訊息')).toBeInTheDocument()
    })

    it('當用戶未登入時應該渲染 fallback', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        user: null,
      })
      
      render(
        <PermissionGate 
          requiredRoles={['STAFF']} 
          fallback={<div>請先登入</div>}
        >
          <div>受保護的內容</div>
        </PermissionGate>
      )
      
      expect(screen.queryByText('受保護的內容')).not.toBeInTheDocument()
      expect(screen.getByText('請先登入')).toBeInTheDocument()
    })
  })

  describe('角色權限檢查', () => {
    it('應該正確檢查單一角色權限', () => {
      defaultAuthReturn.hasRole.mockReturnValue(true)
      
      render(
        <PermissionGate requiredRoles={['ADMIN']}>
          <div>管理員內容</div>
        </PermissionGate>
      )
      
      expect(defaultAuthReturn.hasRole).toHaveBeenCalledWith(['ADMIN'])
      expect(screen.getByText('管理員內容')).toBeInTheDocument()
    })

    it('應該正確檢查多重角色權限', () => {
      defaultAuthReturn.hasRole.mockReturnValue(true)
      
      render(
        <PermissionGate requiredRoles={['ADMIN', 'MANAGER']}>
          <div>管理員或經理內容</div>
        </PermissionGate>
      )
      
      expect(defaultAuthReturn.hasRole).toHaveBeenCalledWith(['ADMIN', 'MANAGER'])
      expect(screen.getByText('管理員或經理內容')).toBeInTheDocument()
    })

    it('當沒有指定角色時應該允許所有已認證用戶', () => {
      render(
        <PermissionGate>
          <div>所有用戶內容</div>
        </PermissionGate>
      )
      
      expect(screen.getByText('所有用戶內容')).toBeInTheDocument()
      expect(defaultAuthReturn.hasRole).not.toHaveBeenCalled()
    })
  })

  describe('角色簡寫屬性', () => {
    it('adminOnly 應該只允許管理員', () => {
      defaultAuthReturn.hasRole.mockReturnValue(true)
      
      render(
        <PermissionGate adminOnly>
          <div>管理員專用</div>
        </PermissionGate>
      )
      
      expect(defaultAuthReturn.hasRole).toHaveBeenCalledWith(['ADMIN'])
      expect(screen.getByText('管理員專用')).toBeInTheDocument()
    })

    it('managerOnly 應該只允許經理', () => {
      defaultAuthReturn.hasRole.mockReturnValue(true)
      
      render(
        <PermissionGate managerOnly>
          <div>經理專用</div>
        </PermissionGate>
      )
      
      expect(defaultAuthReturn.hasRole).toHaveBeenCalledWith(['MANAGER'])
      expect(screen.getByText('經理專用')).toBeInTheDocument()
    })

    it('staffOnly 應該只允許員工', () => {
      defaultAuthReturn.hasRole.mockReturnValue(true)
      
      render(
        <PermissionGate staffOnly>
          <div>員工專用</div>
        </PermissionGate>
      )
      
      expect(defaultAuthReturn.hasRole).toHaveBeenCalledWith(['STAFF'])
      expect(screen.getByText('員工專用')).toBeInTheDocument()
    })
  })

  describe('功能級權限檢查', () => {
    it('應該檢查功能級權限', () => {
      defaultPermissionsReturn.canAny.mockReturnValue(true)
      
      render(
        <PermissionGate requiredPermissions={['customers.create']}>
          <div>創建客戶按鈕</div>
        </PermissionGate>
      )
      
      expect(defaultPermissionsReturn.canAny).toHaveBeenCalledWith(['customers.create'])
      expect(screen.getByText('創建客戶按鈕')).toBeInTheDocument()
    })

    it('功能級權限應該優先於角色權限', () => {
      defaultPermissionsReturn.canAny.mockReturnValue(true)
      defaultAuthReturn.hasRole.mockReturnValue(false)
      
      render(
        <PermissionGate 
          requiredPermissions={['customers.create']} 
          requiredRoles={['ADMIN']}
        >
          <div>創建客戶按鈕</div>
        </PermissionGate>
      )
      
      expect(defaultPermissionsReturn.canAny).toHaveBeenCalledWith(['customers.create'])
      expect(defaultAuthReturn.hasRole).not.toHaveBeenCalled()
      expect(screen.getByText('創建客戶按鈕')).toBeInTheDocument()
    })

    it('當功能權限檢查失敗時應該渲染 fallback', () => {
      defaultPermissionsReturn.canAny.mockReturnValue(false)
      
      render(
        <PermissionGate 
          requiredPermissions={['customers.create']}
          fallback={<div>無創建權限</div>}
        >
          <div>創建客戶按鈕</div>
        </PermissionGate>
      )
      
      expect(screen.queryByText('創建客戶按鈕')).not.toBeInTheDocument()
      expect(screen.getByText('無創建權限')).toBeInTheDocument()
    })
  })

  describe('隱藏模式', () => {
    it('hideWhenNoPermission 為 true 時無權限應該渲染 null', () => {
      defaultAuthReturn.hasRole.mockReturnValue(false)
      
      render(
        <PermissionGate 
          requiredRoles={['ADMIN']}
          fallback={<div>無權限訊息</div>}
          hideWhenNoPermission={true}
        >
          <div>受保護的內容</div>
        </PermissionGate>
      )
      
      expect(screen.queryByText('受保護的內容')).not.toBeInTheDocument()
      expect(screen.queryByText('無權限訊息')).not.toBeInTheDocument()
    })

    it('hideWhenNoPermission 為 true 時用戶未登入應該渲染 null', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        user: null,
      })
      
      render(
        <PermissionGate 
          requiredRoles={['STAFF']}
          fallback={<div>請先登入</div>}
          hideWhenNoPermission={true}
        >
          <div>受保護的內容</div>
        </PermissionGate>
      )
      
      expect(screen.queryByText('受保護的內容')).not.toBeInTheDocument()
      expect(screen.queryByText('請先登入')).not.toBeInTheDocument()
    })
  })

  describe('角色快照測試', () => {
    it('ADMIN 用戶可以訪問所有層級的內容', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        user: mockAdminUser,
        hasRole: vi.fn().mockReturnValue(true),
      })
      
      const { container } = render(
        <div>
          <PermissionGate adminOnly>
            <div data-testid="admin-content">管理員內容</div>
          </PermissionGate>
          <PermissionGate managerOnly>
            <div data-testid="manager-content">經理內容</div>
          </PermissionGate>
          <PermissionGate staffOnly>
            <div data-testid="staff-content">員工內容</div>
          </PermissionGate>
        </div>
      )
      
      expect(screen.getByTestId('admin-content')).toBeInTheDocument()
      expect(screen.getByTestId('manager-content')).toBeInTheDocument()
      expect(screen.getByTestId('staff-content')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })

    it('MANAGER 用戶只能訪問經理和員工內容', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        user: mockManagerUser,
        hasRole: vi.fn((roles) => {
          if (roles.includes('ADMIN')) return false
          if (roles.includes('MANAGER')) return true
          if (roles.includes('STAFF')) return true
          return false
        }),
      })
      
      const { container } = render(
        <div>
          <PermissionGate adminOnly fallback={<div data-testid="no-admin">無管理員權限</div>}>
            <div data-testid="admin-content">管理員內容</div>
          </PermissionGate>
          <PermissionGate managerOnly>
            <div data-testid="manager-content">經理內容</div>
          </PermissionGate>
          <PermissionGate staffOnly>
            <div data-testid="staff-content">員工內容</div>
          </PermissionGate>
        </div>
      )
      
      expect(screen.getByTestId('no-admin')).toBeInTheDocument()
      expect(screen.getByTestId('manager-content')).toBeInTheDocument()
      expect(screen.getByTestId('staff-content')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })

    it('STAFF 用戶只能訪問員工內容', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        user: mockUser,
        hasRole: vi.fn((roles) => {
          if (roles.includes('ADMIN')) return false
          if (roles.includes('MANAGER')) return false
          if (roles.includes('STAFF')) return true
          return false
        }),
      })
      
      const { container } = render(
        <div>
          <PermissionGate adminOnly fallback={<div data-testid="no-admin">無管理員權限</div>}>
            <div data-testid="admin-content">管理員內容</div>
          </PermissionGate>
          <PermissionGate managerOnly fallback={<div data-testid="no-manager">無經理權限</div>}>
            <div data-testid="manager-content">經理內容</div>
          </PermissionGate>
          <PermissionGate staffOnly>
            <div data-testid="staff-content">員工內容</div>
          </PermissionGate>
        </div>
      )
      
      expect(screen.getByTestId('no-admin')).toBeInTheDocument()
      expect(screen.getByTestId('no-manager')).toBeInTheDocument()
      expect(screen.getByTestId('staff-content')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })
  })

  describe('互動測試', () => {
    it('應該正確響應權限狀態變化', () => {
      const hasRoleMock = vi.fn().mockReturnValue(false)
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        hasRole: hasRoleMock,
      })
      
      const { rerender } = render(
        <PermissionGate 
          requiredRoles={['ADMIN']}
          fallback={<div>無權限</div>}
        >
          <div>管理員內容</div>
        </PermissionGate>
      )
      
      expect(screen.getByText('無權限')).toBeInTheDocument()
      expect(screen.queryByText('管理員內容')).not.toBeInTheDocument()
      
      // 模擬權限狀態改變
      hasRoleMock.mockReturnValue(true)
      
      rerender(
        <PermissionGate 
          requiredRoles={['ADMIN']}
          fallback={<div>無權限</div>}
        >
          <div>管理員內容</div>
        </PermissionGate>
      )
      
      expect(screen.queryByText('無權限')).not.toBeInTheDocument()
      expect(screen.getByText('管理員內容')).toBeInTheDocument()
    })

    it('應該正確響應用戶登入狀態變化', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        user: null,
      })
      
      const { rerender } = render(
        <PermissionGate fallback={<div>請登入</div>}>
          <div>用戶內容</div>
        </PermissionGate>
      )
      
      expect(screen.getByText('請登入')).toBeInTheDocument()
      expect(screen.queryByText('用戶內容')).not.toBeInTheDocument()
      
      // 模擬用戶登入
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        user: mockUser,
      })
      
      rerender(
        <PermissionGate fallback={<div>請登入</div>}>
          <div>用戶內容</div>
        </PermissionGate>
      )
      
      expect(screen.queryByText('請登入')).not.toBeInTheDocument()
      expect(screen.getByText('用戶內容')).toBeInTheDocument()
    })
  })

  describe('邊界情況', () => {
    it('應該處理空的 requiredRoles 陣列', () => {
      render(
        <PermissionGate requiredRoles={[]}>
          <div>所有用戶內容</div>
        </PermissionGate>
      )
      
      expect(screen.getByText('所有用戶內容')).toBeInTheDocument()
      expect(defaultAuthReturn.hasRole).not.toHaveBeenCalled()
    })

    it('應該處理空的 requiredPermissions 陣列', () => {
      defaultAuthReturn.hasRole.mockReturnValue(true)
      
      render(
        <PermissionGate 
          requiredPermissions={[]} 
          requiredRoles={['STAFF']}
        >
          <div>員工內容</div>
        </PermissionGate>
      )
      
      expect(screen.getByText('員工內容')).toBeInTheDocument()
      expect(defaultPermissionsReturn.canAny).not.toHaveBeenCalled()
      expect(defaultAuthReturn.hasRole).toHaveBeenCalledWith(['STAFF'])
    })

    it('應該處理複雜的嵌套權限組合', () => {
      defaultPermissionsReturn.canAny.mockImplementation((permissions) => {
        return permissions.includes('customers.create')
      })
      
      render(
        <PermissionGate requiredPermissions={['customers.create']}>
          <div>外層內容</div>
          <PermissionGate requiredPermissions={['customers.delete']}>
            <div>內層刪除內容</div>
          </PermissionGate>
        </PermissionGate>
      )
      
      expect(screen.getByText('外層內容')).toBeInTheDocument()
      expect(screen.queryByText('內層刪除內容')).not.toBeInTheDocument()
    })
  })
})