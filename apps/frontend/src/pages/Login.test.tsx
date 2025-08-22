import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { Navigate } from 'react-router-dom'
import Login from './Login'
import * as authHook from '@/hooks/useAuth'
import toast from 'react-hot-toast'

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: vi.fn(() => null),
  }
})

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockUseAuth = vi.spyOn(authHook, 'useAuth')

const defaultAuthReturn = {
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  hasRole: vi.fn(),
  isLoading: false,
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue(defaultAuthReturn)
  })

  describe('基本渲染', () => {
    it('應該正確渲染登入表單', () => {
      render(<Login />)
      
      expect(screen.getByText('登入 CRM 系統')).toBeInTheDocument()
      expect(screen.getByText('請使用您的帳號密碼登入系統')).toBeInTheDocument()
      expect(screen.getByLabelText('電子郵件')).toBeInTheDocument()
      expect(screen.getByLabelText('密碼')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument()
    })

    it('應該正確設置表單欄位屬性', () => {
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const passwordInput = screen.getByLabelText('密碼')
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
      expect(emailInput).toHaveAttribute('placeholder', '請輸入您的電子郵件')
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
      expect(passwordInput).toHaveAttribute('placeholder', '請輸入您的密碼')
    })
  })

  describe('載入狀態', () => {
    it('當 isLoading 為 true 時應該顯示載入中', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        isLoading: true,
      })
      
      render(<Login />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.queryByText('登入 CRM 系統')).not.toBeInTheDocument()
    })
  })

  describe('登入後重定向', () => {
    it('當用戶已登入時應該重定向到 dashboard', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        user: { id: '1', email: 'test@example.com', role: 'STAFF' },
      })
      
      render(<Login />)
      
      expect(Navigate).toHaveBeenCalledWith(
        { to: '/dashboard', replace: true },
        {}
      )
    })
  })

  describe('表單驗證', () => {
    it('應該驗證電子郵件格式', async () => {
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('請輸入有效的電子郵件地址')).toBeInTheDocument()
      })
    })

    it('應該驗證密碼長度', async () => {
      render(<Login />)
      
      const passwordInput = screen.getByLabelText('密碼')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('密碼至少需要6個字符')).toBeInTheDocument()
      })
    })

    it('應該同時顯示多個驗證錯誤', async () => {
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const passwordInput = screen.getByLabelText('密碼')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('請輸入有效的電子郵件地址')).toBeInTheDocument()
        expect(screen.getByText('密碼至少需要6個字符')).toBeInTheDocument()
      })
    })

    it('當欄位為空時應該顯示驗證錯誤', async () => {
      render(<Login />)
      
      const submitButton = screen.getByRole('button', { name: '登入' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('請輸入有效的電子郵件地址')).toBeInTheDocument()
        expect(screen.getByText('密碼至少需要6個字符')).toBeInTheDocument()
      })
    })
  })

  describe('表單提交', () => {
    it('應該使用正確的資料呼叫 login 函數', async () => {
      const mockLogin = vi.fn().mockResolvedValue(undefined)
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        login: mockLogin,
      })
      
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const passwordInput = screen.getByLabelText('密碼')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('登入成功時應該顯示成功訊息', async () => {
      const mockLogin = vi.fn().mockResolvedValue(undefined)
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        login: mockLogin,
      })
      
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const passwordInput = screen.getByLabelText('密碼')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('登入成功')
      })
    })

    it('登入失敗時應該顯示錯誤訊息', async () => {
      const mockLogin = vi.fn().mockRejectedValue({
        response: { data: { message: '帳號或密碼錯誤' } }
      })
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        login: mockLogin,
      })
      
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const passwordInput = screen.getByLabelText('密碼')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('帳號或密碼錯誤')
      })
    })

    it('網絡錯誤時應該顯示通用錯誤訊息', async () => {
      const mockLogin = vi.fn().mockRejectedValue(new Error('Network Error'))
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        login: mockLogin,
      })
      
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const passwordInput = screen.getByLabelText('密碼')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network Error')
      })
    })

    it('未知錯誤時應該顯示預設錯誤訊息', async () => {
      const mockLogin = vi.fn().mockRejectedValue({})
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        login: mockLogin,
      })
      
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const passwordInput = screen.getByLabelText('密碼')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('登入失敗')
      })
    })
  })

  describe('提交狀態', () => {
    it('提交時按鈕應該顯示載入狀態', async () => {
      let resolveLogin: () => void
      const mockLogin = vi.fn(() => new Promise<void>((resolve) => {
        resolveLogin = resolve
      }))
      
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        login: mockLogin,
      })
      
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const passwordInput = screen.getByLabelText('密碼')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '登入中...' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '登入中...' })).toBeDisabled()
      })
      
      // 完成登入
      resolveLogin!()
      
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: '登入中...' })).not.toBeInTheDocument()
      })
    })

    it('提交時不應該重複提交', async () => {
      let resolveLogin: () => void
      const mockLogin = vi.fn(() => new Promise<void>((resolve) => {
        resolveLogin = resolve
      }))
      
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        login: mockLogin,
      })
      
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const passwordInput = screen.getByLabelText('密碼')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      // 點擊多次
      fireEvent.click(submitButton)
      fireEvent.click(submitButton)
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1)
      })
      
      // 完成登入
      resolveLogin!()
    })
  })

  describe('表單互動', () => {
    it('應該支援 Enter 鍵提交表單', async () => {
      const mockLogin = vi.fn().mockResolvedValue(undefined)
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        login: mockLogin,
      })
      
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const passwordInput = screen.getByLabelText('密碼')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' })
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('輸入內容後錯誤訊息應該消失', async () => {
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      // 觸發驗證錯誤
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('請輸入有效的電子郵件地址')).toBeInTheDocument()
      })
      
      // 修正輸入
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
      await waitFor(() => {
        expect(screen.queryByText('請輸入有效的電子郵件地址')).not.toBeInTheDocument()
      })
    })

    it('應該正確處理表單重置', async () => {
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const passwordInput = screen.getByLabelText('密碼')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('password123')
      
      // 表單重置（通過重新渲染模擬）
      const { rerender } = render(<Login />)
      rerender(<Login />)
      
      const newEmailInput = screen.getByLabelText('電子郵件')
      const newPasswordInput = screen.getByLabelText('密碼')
      
      expect(newEmailInput).toHaveValue('')
      expect(newPasswordInput).toHaveValue('')
    })
  })

  describe('無障礙功能', () => {
    it('應該正確設置 ARIA 標籤', () => {
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const passwordInput = screen.getByLabelText('密碼')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      expect(emailInput).toHaveAttribute('id')
      expect(passwordInput).toHaveAttribute('id')
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('錯誤訊息應該與輸入欄位關聯', async () => {
      render(<Login />)
      
      const emailInput = screen.getByLabelText('電子郵件')
      const submitButton = screen.getByRole('button', { name: '登入' })
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        const errorMessage = screen.getByText('請輸入有效的電子郵件地址')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveClass('form-error')
      })
    })
  })
})