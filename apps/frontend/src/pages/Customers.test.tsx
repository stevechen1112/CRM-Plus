import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@/test/utils'
import { BrowserRouter } from 'react-router-dom'
import Customers from './Customers'
import * as permissionsHook from '@/hooks/usePermissions'
import * as importExportHook from '@/hooks/useImportExport'
import * as confirmDialogHook from '@/components/common'
import toast from 'react-hot-toast'

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ to, children, className }: any) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  }
})

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const mockUsePermissions = vi.spyOn(permissionsHook, 'usePermissions')
const mockUseCustomerExport = vi.spyOn(importExportHook, 'useCustomerExport')
const mockUseConfirmDialog = vi.spyOn(confirmDialogHook, 'useConfirmDialog')

const defaultPermissionsReturn = {
  can: vi.fn(),
  canAny: vi.fn(),
  canAll: vi.fn(),
  permissions: [],
}

const defaultExportReturn = {
  mutate: vi.fn(),
  isLoading: false,
  error: null,
  data: null,
}

const defaultConfirmReturn = {
  showConfirm: vi.fn(),
}

describe('Customers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePermissions.mockReturnValue(defaultPermissionsReturn)
    mockUseCustomerExport.mockReturnValue(defaultExportReturn)
    mockUseConfirmDialog.mockReturnValue(defaultConfirmReturn)
    
    // 預設所有權限都有
    defaultPermissionsReturn.can.mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderCustomers = () => {
    return render(
      <BrowserRouter>
        <Customers />
      </BrowserRouter>
    )
  }

  describe('基本渲染', () => {
    it('應該正確渲染頁面標題和描述', () => {
      renderCustomers()
      
      expect(screen.getByText('客戶管理')).toBeInTheDocument()
      expect(screen.getByText('管理您的客戶資料和關係')).toBeInTheDocument()
    })

    it('應該渲染客戶列表', () => {
      renderCustomers()
      
      // 檢查是否渲染了 mock 資料中的客戶
      expect(screen.getByText('王小明')).toBeInTheDocument()
      expect(screen.getByText('李大華')).toBeInTheDocument()
      expect(screen.getByText('陳美玲')).toBeInTheDocument()
      expect(screen.getByText('林志明')).toBeInTheDocument()
    })

    it('應該渲染表格欄位標題', () => {
      renderCustomers()
      
      expect(screen.getByText('客戶資訊')).toBeInTheDocument()
      expect(screen.getByText('聯絡方式')).toBeInTheDocument()
      expect(screen.getByText('狀態')).toBeInTheDocument()
      expect(screen.getByText('來源')).toBeInTheDocument()
      expect(screen.getByText('加入日期')).toBeInTheDocument()
    })

    it('應該顯示客戶的詳細資訊', () => {
      renderCustomers()
      
      // 檢查第一個客戶的詳細資訊
      expect(screen.getByText('王小明')).toBeInTheDocument()
      expect(screen.getByText('ABC 公司')).toBeInTheDocument()
      expect(screen.getByText('0912345678')).toBeInTheDocument()
      expect(screen.getByText('wang@example.com')).toBeInTheDocument()
      expect(screen.getByText('活躍')).toBeInTheDocument()
      expect(screen.getByText('推薦')).toBeInTheDocument()
    })
  })

  describe('搜尋功能', () => {
    it('應該渲染搜尋框', () => {
      renderCustomers()
      
      const searchInput = screen.getByPlaceholderText('搜尋客戶姓名、電話或公司...')
      expect(searchInput).toBeInTheDocument()
    })

    it('應該根據客戶姓名篩選結果', async () => {
      renderCustomers()
      
      const searchInput = screen.getByPlaceholderText('搜尋客戶姓名、電話或公司...')
      fireEvent.change(searchInput, { target: { value: '王小明' } })
      
      await waitFor(() => {
        expect(screen.getByText('王小明')).toBeInTheDocument()
        expect(screen.queryByText('李大華')).not.toBeInTheDocument()
        expect(screen.queryByText('陳美玲')).not.toBeInTheDocument()
        expect(screen.queryByText('林志明')).not.toBeInTheDocument()
      })
    })

    it('應該根據電話號碼篩選結果', async () => {
      renderCustomers()
      
      const searchInput = screen.getByPlaceholderText('搜尋客戶姓名、電話或公司...')
      fireEvent.change(searchInput, { target: { value: '0987654321' } })
      
      await waitFor(() => {
        expect(screen.getByText('李大華')).toBeInTheDocument()
        expect(screen.queryByText('王小明')).not.toBeInTheDocument()
      })
    })

    it('應該根據公司名稱篩選結果', async () => {
      renderCustomers()
      
      const searchInput = screen.getByPlaceholderText('搜尋客戶姓名、電話或公司...')
      fireEvent.change(searchInput, { target: { value: 'ABC' } })
      
      await waitFor(() => {
        expect(screen.getByText('王小明')).toBeInTheDocument()
        expect(screen.queryByText('李大華')).not.toBeInTheDocument()
      })
    })

    it('應該支援大小寫不敏感的搜尋', async () => {
      renderCustomers()
      
      const searchInput = screen.getByPlaceholderText('搜尋客戶姓名、電話或公司...')
      fireEvent.change(searchInput, { target: { value: 'abc' } })
      
      await waitFor(() => {
        expect(screen.getByText('王小明')).toBeInTheDocument()
      })
    })

    it('沒有搜尋結果時應該顯示空狀態', async () => {
      renderCustomers()
      
      const searchInput = screen.getByPlaceholderText('搜尋客戶姓名、電話或公司...')
      fireEvent.change(searchInput, { target: { value: '不存在的客戶' } })
      
      await waitFor(() => {
        expect(screen.getByText('沒有找到客戶資料')).toBeInTheDocument()
      })
    })
  })

  describe('篩選功能', () => {
    it('應該渲染來源篩選下拉選單', () => {
      renderCustomers()
      
      const sourceSelect = screen.getByDisplayValue('所有來源')
      expect(sourceSelect).toBeInTheDocument()
      
      fireEvent.click(sourceSelect)
      expect(screen.getByText('官網')).toBeInTheDocument()
      expect(screen.getByText('推薦')).toBeInTheDocument()
      expect(screen.getByText('陌生開發')).toBeInTheDocument()
    })

    it('應該渲染城市篩選下拉選單', () => {
      renderCustomers()
      
      const citySelect = screen.getByDisplayValue('所有城市')
      expect(citySelect).toBeInTheDocument()
      
      fireEvent.click(citySelect)
      expect(screen.getByText('台北')).toBeInTheDocument()
      expect(screen.getByText('新北')).toBeInTheDocument()
      expect(screen.getByText('台中')).toBeInTheDocument()
      expect(screen.getByText('高雄')).toBeInTheDocument()
    })

    it('應該根據來源篩選客戶', async () => {
      renderCustomers()
      
      const sourceSelect = screen.getByDisplayValue('所有來源')
      fireEvent.change(sourceSelect, { target: { value: 'REFERRAL' } })
      
      await waitFor(() => {
        expect(screen.getByText('王小明')).toBeInTheDocument()
        expect(screen.queryByText('李大華')).not.toBeInTheDocument()
      })
    })

    it('應該支援組合搜尋和篩選', async () => {
      renderCustomers()
      
      const searchInput = screen.getByPlaceholderText('搜尋客戶姓名、電話或公司...')
      const sourceSelect = screen.getByDisplayValue('所有來源')
      
      fireEvent.change(searchInput, { target: { value: '李' } })
      fireEvent.change(sourceSelect, { target: { value: 'WEBSITE' } })
      
      await waitFor(() => {
        expect(screen.getByText('李大華')).toBeInTheDocument()
        expect(screen.queryByText('王小明')).not.toBeInTheDocument()
      })
    })
  })

  describe('權限控制', () => {
    it('有創建權限時應該顯示新增按鈕', () => {
      defaultPermissionsReturn.can.mockImplementation((permission) => 
        permission === 'customers.create'
      )
      
      renderCustomers()
      
      expect(screen.getByRole('button', { name: /新增客戶/ })).toBeInTheDocument()
    })

    it('沒有創建權限時不應該顯示新增按鈕', () => {
      defaultPermissionsReturn.can.mockImplementation((permission) => 
        permission !== 'customers.create'
      )
      
      renderCustomers()
      
      expect(screen.queryByRole('button', { name: /新增客戶/ })).not.toBeInTheDocument()
    })

    it('有匯出權限時應該顯示匯出按鈕', () => {
      defaultPermissionsReturn.can.mockImplementation((permission) => 
        permission === 'customers.export'
      )
      
      renderCustomers()
      
      expect(screen.getByRole('button', { name: /匯出 CSV/ })).toBeInTheDocument()
    })

    it('有匯入權限時應該顯示匯入連結', () => {
      defaultPermissionsReturn.can.mockImplementation((permission) => 
        permission === 'import.export'
      )
      
      renderCustomers()
      
      expect(screen.getByRole('link', { name: /匯入資料/ })).toBeInTheDocument()
    })

    it('有編輯權限時應該顯示編輯按鈕', () => {
      defaultPermissionsReturn.can.mockImplementation((permission) => 
        permission === 'customers.edit'
      )
      
      renderCustomers()
      
      const editButtons = screen.getAllByText('編輯')
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('有刪除權限時應該顯示刪除按鈕', () => {
      defaultPermissionsReturn.can.mockImplementation((permission) => 
        permission === 'customers.delete'
      )
      
      renderCustomers()
      
      const deleteButtons = screen.getAllByText('刪除')
      expect(deleteButtons.length).toBeGreaterThan(0)
    })
  })

  describe('客戶操作', () => {
    it('點擊新增客戶按鈕應該顯示提示訊息', () => {
      renderCustomers()
      
      const addButton = screen.getByRole('button', { name: /新增客戶/ })
      fireEvent.click(addButton)
      
      expect(toast.info).toHaveBeenCalledWith('新增客戶', '正在開啟新增客戶表單...')
    })

    it('點擊編輯按鈕應該顯示提示訊息', () => {
      renderCustomers()
      
      const editButtons = screen.getAllByText('編輯')
      fireEvent.click(editButtons[0])
      
      expect(toast.info).toHaveBeenCalledWith('載入編輯頁面', '正在編輯客戶 王小明 的資料...')
    })

    it('點擊刪除按鈕應該顯示確認對話框', () => {
      const mockShowConfirm = vi.fn()
      mockUseConfirmDialog.mockReturnValue({
        showConfirm: mockShowConfirm,
      })
      
      renderCustomers()
      
      const deleteButtons = screen.getAllByText('刪除')
      fireEvent.click(deleteButtons[0])
      
      expect(mockShowConfirm).toHaveBeenCalledWith({
        title: '刪除客戶',
        description: '確定要刪除客戶 王小明 嗎？此操作無法復原。',
        type: 'danger',
        confirmText: '刪除',
        cancelText: '取消',
        onConfirm: expect.any(Function),
      })
    })

    it('確認刪除應該執行刪除邏輯', async () => {
      const mockShowConfirm = vi.fn().mockImplementation(({ onConfirm }) => {
        onConfirm()
      })
      mockUseConfirmDialog.mockReturnValue({
        showConfirm: mockShowConfirm,
      })
      
      renderCustomers()
      
      const deleteButtons = screen.getAllByText('刪除')
      fireEvent.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('刪除成功', '已成功刪除客戶 王小明')
      })
    })
  })

  describe('匯出功能', () => {
    it('點擊匯出按鈕應該觸發匯出', () => {
      const mockMutate = vi.fn()
      mockUseCustomerExport.mockReturnValue({
        ...defaultExportReturn,
        mutate: mockMutate,
      })
      
      renderCustomers()
      
      const exportButton = screen.getByRole('button', { name: /匯出 CSV/ })
      fireEvent.click(exportButton)
      
      expect(toast.info).toHaveBeenCalledWith('開始匯出', '正在準備客戶資料...')
      expect(mockMutate).toHaveBeenCalled()
    })

    it('匯出中時按鈕應該顯示載入狀態', () => {
      mockUseCustomerExport.mockReturnValue({
        ...defaultExportReturn,
        isLoading: true,
      })
      
      renderCustomers()
      
      const exportButton = screen.getByRole('button', { name: /匯出中.../ })
      expect(exportButton).toBeDisabled()
    })

    it('匯出成功時應該顯示成功訊息', () => {
      const mockMutate = vi.fn().mockImplementation((query, { onSuccess }) => {
        onSuccess()
      })
      mockUseCustomerExport.mockReturnValue({
        ...defaultExportReturn,
        mutate: mockMutate,
      })
      
      renderCustomers()
      
      const exportButton = screen.getByRole('button', { name: /匯出 CSV/ })
      fireEvent.click(exportButton)
      
      expect(toast.success).toHaveBeenCalledWith('匯出成功', '客戶資料已成功匯出為 CSV 檔案')
    })

    it('匯出失敗時應該顯示錯誤訊息', () => {
      const mockMutate = vi.fn().mockImplementation((query, { onError }) => {
        onError({ message: '伺服器錯誤' })
      })
      mockUseCustomerExport.mockReturnValue({
        ...defaultExportReturn,
        mutate: mockMutate,
      })
      
      renderCustomers()
      
      const exportButton = screen.getByRole('button', { name: /匯出 CSV/ })
      fireEvent.click(exportButton)
      
      expect(toast.error).toHaveBeenCalledWith('匯出失敗', '伺服器錯誤')
    })
  })

  describe('狀態顯示', () => {
    it('應該正確顯示不同的客戶狀態', () => {
      renderCustomers()
      
      expect(screen.getByText('活躍')).toBeInTheDocument()
      expect(screen.getByText('潛在')).toBeInTheDocument()
      expect(screen.getByText('不活躍')).toBeInTheDocument()
    })

    it('狀態標籤應該有正確的樣式', () => {
      renderCustomers()
      
      const activeStatus = screen.getAllByText('活躍')[0]
      const potentialStatus = screen.getByText('潛在')
      const inactiveStatus = screen.getByText('不活躍')
      
      expect(activeStatus).toHaveClass('badge-success')
      expect(potentialStatus).toHaveClass('badge-warning')
      expect(inactiveStatus).toHaveClass('badge-gray')
    })
  })

  describe('來源顯示', () => {
    it('應該正確顯示不同的客戶來源', () => {
      renderCustomers()
      
      expect(screen.getByText('推薦')).toBeInTheDocument()
      expect(screen.getByText('網站')).toBeInTheDocument()
      expect(screen.getByText('廣告')).toBeInTheDocument()
      expect(screen.getByText('陌生開發')).toBeInTheDocument()
    })
  })

  describe('分頁功能', () => {
    it('應該顯示分頁控制項', () => {
      renderCustomers()
      
      // 檢查是否有分頁相關元素
      expect(screen.getByText(/共.*筆/)).toBeInTheDocument()
    })
  })

  describe('響應式設計', () => {
    it('小螢幕時應該使用卡片模式', () => {
      // 模擬小螢幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })
      window.dispatchEvent(new Event('resize'))
      
      renderCustomers()
      
      // 在小螢幕模式下，卡片中的按鈕應該存在
      const viewButtons = screen.getAllByText('查看')
      expect(viewButtons.length).toBeGreaterThan(0)
    })
  })

  describe('空狀態處理', () => {
    it('篩選後沒有結果時應該顯示空狀態訊息', async () => {
      renderCustomers()
      
      const searchInput = screen.getByPlaceholderText('搜尋客戶姓名、電話或公司...')
      fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } })
      
      await waitFor(() => {
        expect(screen.getByText('沒有找到客戶資料')).toBeInTheDocument()
      })
    })
  })

  describe('互動測試', () => {
    it('搜尋框應該正確更新值', () => {
      renderCustomers()
      
      const searchInput = screen.getByPlaceholderText('搜尋客戶姓名、電話或公司...')
      fireEvent.change(searchInput, { target: { value: '測試搜尋' } })
      
      expect(searchInput).toHaveValue('測試搜尋')
    })

    it('篩選選單應該正確更新值', () => {
      renderCustomers()
      
      const sourceSelect = screen.getByDisplayValue('所有來源')
      fireEvent.change(sourceSelect, { target: { value: 'WEBSITE' } })
      
      expect(sourceSelect).toHaveValue('WEBSITE')
    })

    it('應該能夠重置搜尋條件', async () => {
      renderCustomers()
      
      const searchInput = screen.getByPlaceholderText('搜尋客戶姓名、電話或公司...')
      
      // 設置搜尋條件
      fireEvent.change(searchInput, { target: { value: '王小明' } })
      await waitFor(() => {
        expect(screen.queryByText('李大華')).not.toBeInTheDocument()
      })
      
      // 清除搜尋條件
      fireEvent.change(searchInput, { target: { value: '' } })
      await waitFor(() => {
        expect(screen.getByText('李大華')).toBeInTheDocument()
      })
    })
  })
})