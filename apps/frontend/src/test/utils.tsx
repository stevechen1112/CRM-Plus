import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/common'

// 建立測試專用的 QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// 測試提供者
interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          {children}
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// 自定義 render 函數
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// 測試用戶資料
export const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'STAFF' as const,
  isActive: true,
}

export const mockAdminUser = {
  id: '2',
  username: 'admin',
  email: 'admin@example.com',
  role: 'ADMIN' as const,
  isActive: true,
}

export const mockManagerUser = {
  id: '3',
  username: 'manager',
  email: 'manager@example.com',
  role: 'MANAGER' as const,
  isActive: true,
}

// 測試客戶資料
export const mockCustomer = {
  phone: '0912345678',
  name: '測試客戶',
  email: 'test@example.com',
  tags: ['測試'],
  region: '台北',
  marketingConsent: true,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
}

// 測試訂單資料
export const mockOrder = {
  id: '1',
  orderNo: 'ORD001',
  customerPhone: '0912345678',
  totalAmount: 1000,
  paymentStatus: 'PENDING' as const,
  orderStatus: 'CONFIRMED' as const,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  items: [
    {
      id: '1',
      productName: '測試商品',
      quantity: 1,
      unitPrice: 1000,
      totalPrice: 1000,
    },
  ],
}

// 等待異步操作
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

// 模擬文件上傳
export const createMockFile = (name: string, content: string, type: string) => {
  const file = new File([content], name, { type })
  Object.defineProperty(file, 'size', { value: content.length })
  return file
}

// 模擬 localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// 模擬 React Router hooks
export const mockNavigate = vi.fn()
export const mockUseParams = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: mockUseParams,
  }
})