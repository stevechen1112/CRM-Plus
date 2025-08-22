import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { TableList } from './TableList'
import type { TableColumn } from './TableList'

const mockData = [
  { id: '1', name: '張三', email: 'zhang@example.com', status: 'active' },
  { id: '2', name: '李四', email: 'li@example.com', status: 'inactive' },
  { id: '3', name: '王五', email: 'wang@example.com', status: 'active' },
]

const mockColumns: TableColumn[] = [
  { key: 'name', title: '姓名' },
  { key: 'email', title: '電子郵件' },
  {
    key: 'status',
    title: '狀態',
    render: (value) => (
      <span className={value === 'active' ? 'text-green-600' : 'text-red-600'}>
        {value === 'active' ? '啟用' : '停用'}
      </span>
    ),
  },
]

const mockActions = [
  {
    label: '編輯',
    onClick: vi.fn(),
    variant: 'primary' as const,
  },
  {
    label: '刪除',
    onClick: vi.fn(),
    variant: 'danger' as const,
    show: (record: any) => record.status === 'active',
  },
]

describe('TableList', () => {
  describe('基本渲染', () => {
    it('應該正確渲染表格標題', () => {
      render(<TableList data={mockData} columns={mockColumns} />)
      
      expect(screen.getByText('姓名')).toBeInTheDocument()
      expect(screen.getByText('電子郵件')).toBeInTheDocument()
      expect(screen.getByText('狀態')).toBeInTheDocument()
    })

    it('應該正確渲染表格資料', () => {
      render(<TableList data={mockData} columns={mockColumns} />)
      
      expect(screen.getByText('張三')).toBeInTheDocument()
      expect(screen.getByText('zhang@example.com')).toBeInTheDocument()
      expect(screen.getByText('李四')).toBeInTheDocument()
      expect(screen.getByText('li@example.com')).toBeInTheDocument()
    })

    it('應該正確渲染自定義欄位', () => {
      render(<TableList data={mockData} columns={mockColumns} />)
      
      const activeStatuses = screen.getAllByText('啟用')
      const inactiveStatuses = screen.getAllByText('停用')
      
      expect(activeStatuses).toHaveLength(2) // 張三和王五
      expect(inactiveStatuses).toHaveLength(1) // 李四
    })
  })

  describe('空資料處理', () => {
    it('應該顯示空資料訊息', () => {
      render(
        <TableList
          data={[]}
          columns={mockColumns}
          emptyText="無資料"
          emptyDescription="目前沒有任何資料"
        />
      )
      
      expect(screen.getByText('無資料')).toBeInTheDocument()
      expect(screen.getByText('目前沒有任何資料')).toBeInTheDocument()
    })
  })

  describe('載入狀態', () => {
    it('應該顯示載入指示器', () => {
      render(<TableList data={[]} columns={mockColumns} loading={true} />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('行操作', () => {
    it('應該渲染行操作按鈕', () => {
      render(
        <TableList
          data={mockData}
          columns={mockColumns}
          rowActions={mockActions}
        />
      )
      
      const editButtons = screen.getAllByText('編輯')
      expect(editButtons).toHaveLength(3) // 每行都有編輯按鈕
      
      const deleteButtons = screen.getAllByText('刪除')
      expect(deleteButtons).toHaveLength(2) // 只有 active 狀態的有刪除按鈕
    })

    it('應該正確觸發操作回調', async () => {
      const mockEditClick = vi.fn()
      const actions = [
        {
          label: '編輯',
          onClick: mockEditClick,
          variant: 'primary' as const,
        },
      ]

      render(
        <TableList
          data={mockData}
          columns={mockColumns}
          rowActions={actions}
        />
      )
      
      const firstEditButton = screen.getAllByText('編輯')[0]
      fireEvent.click(firstEditButton)
      
      await waitFor(() => {
        expect(mockEditClick).toHaveBeenCalledWith(mockData[0])
      })
    })

    it('應該根據條件顯示/隱藏操作', () => {
      render(
        <TableList
          data={mockData}
          columns={mockColumns}
          rowActions={mockActions}
        />
      )
      
      const rows = screen.getAllByRole('row')
      // 跳過標題行，檢查資料行
      const dataRows = rows.slice(1)
      
      // 第一行（張三，active）應該有刪除按鈕
      expect(dataRows[0]).toHaveTextContent('刪除')
      
      // 第二行（李四，inactive）不應該有刪除按鈕
      expect(dataRows[1]).not.toHaveTextContent('刪除')
      
      // 第三行（王五，active）應該有刪除按鈕
      expect(dataRows[2]).toHaveTextContent('刪除')
    })
  })

  describe('搜尋功能', () => {
    it('應該渲染搜尋框', () => {
      render(
        <TableList
          data={mockData}
          columns={mockColumns}
          searchable={true}
          searchPlaceholder="搜尋用戶"
        />
      )
      
      expect(screen.getByPlaceholderText('搜尋用戶')).toBeInTheDocument()
    })

    it('應該觸發搜尋回調', async () => {
      const mockOnSearch = vi.fn()
      
      render(
        <TableList
          data={mockData}
          columns={mockColumns}
          searchable={true}
          onSearch={mockOnSearch}
        />
      )
      
      const searchInput = screen.getByRole('textbox')
      fireEvent.change(searchInput, { target: { value: '張三' } })
      
      // 模擬用戶停止輸入的延遲
      await waitFor(
        () => {
          expect(mockOnSearch).toHaveBeenCalledWith('張三')
        },
        { timeout: 1000 }
      )
    })
  })

  describe('分頁功能', () => {
    const mockPagination = {
      current: 1,
      pageSize: 10,
      total: 100,
      onPageChange: vi.fn(),
    }

    it('應該渲染分頁控制項', () => {
      render(
        <TableList
          data={mockData}
          columns={mockColumns}
          pagination={mockPagination}
        />
      )
      
      expect(screen.getByText('第 1 頁，共 10 頁')).toBeInTheDocument()
      expect(screen.getByText('共 100 筆')).toBeInTheDocument()
    })

    it('應該觸發分頁變更回調', async () => {
      render(
        <TableList
          data={mockData}
          columns={mockColumns}
          pagination={mockPagination}
        />
      )
      
      const nextButton = screen.getByRole('button', { name: /下一頁/ })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(mockPagination.onPageChange).toHaveBeenCalledWith(2, 10)
      })
    })
  })

  describe('響應式設計', () => {
    const mockMobileCardRender = vi.fn((record) => (
      <div data-testid="mobile-card">
        <h3>{record.name}</h3>
        <p>{record.email}</p>
      </div>
    ))

    beforeEach(() => {
      // 模擬小螢幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })
      window.dispatchEvent(new Event('resize'))
    })

    it('應該在小螢幕顯示手機版卡片', () => {
      render(
        <TableList
          data={mockData}
          columns={mockColumns}
          mobileCardRender={mockMobileCardRender}
        />
      )
      
      const mobileCards = screen.getAllByTestId('mobile-card')
      expect(mobileCards).toHaveLength(3)
      expect(mockMobileCardRender).toHaveBeenCalledTimes(3)
    })
  })

  describe('選擇功能', () => {
    const mockOnSelectionChange = vi.fn()

    it('應該渲染選擇框', () => {
      render(
        <TableList
          data={mockData}
          columns={mockColumns}
          selectable={true}
          onSelectionChange={mockOnSelectionChange}
        />
      )
      
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(4) // 包含全選框
    })

    it('應該支援全選功能', async () => {
      render(
        <TableList
          data={mockData}
          columns={mockColumns}
          selectable={true}
          onSelectionChange={mockOnSelectionChange}
        />
      )
      
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
      fireEvent.click(selectAllCheckbox)
      
      await waitFor(() => {
        expect(mockOnSelectionChange).toHaveBeenCalledWith(
          ['1', '2', '3'],
          mockData
        )
      })
    })

    it('應該支援單個選擇', async () => {
      render(
        <TableList
          data={mockData}
          columns={mockColumns}
          selectable={true}
          onSelectionChange={mockOnSelectionChange}
        />
      )
      
      const firstRowCheckbox = screen.getAllByRole('checkbox')[1]
      fireEvent.click(firstRowCheckbox)
      
      await waitFor(() => {
        expect(mockOnSelectionChange).toHaveBeenCalledWith(
          ['1'],
          [mockData[0]]
        )
      })
    })
  })

  describe('排序功能', () => {
    const mockOnSort = vi.fn()
    const sortableColumns = [
      { key: 'name', title: '姓名', sortable: true },
      { key: 'email', title: '電子郵件', sortable: true },
      { key: 'status', title: '狀態' },
    ]

    it('應該渲染可排序欄位的排序按鈕', () => {
      render(
        <TableList
          data={mockData}
          columns={sortableColumns}
          onSort={mockOnSort}
        />
      )
      
      const nameHeader = screen.getByText('姓名').closest('th')
      const emailHeader = screen.getByText('電子郵件').closest('th')
      const statusHeader = screen.getByText('狀態').closest('th')
      
      expect(nameHeader).toHaveClass('cursor-pointer')
      expect(emailHeader).toHaveClass('cursor-pointer')
      expect(statusHeader).not.toHaveClass('cursor-pointer')
    })

    it('應該觸發排序回調', async () => {
      render(
        <TableList
          data={mockData}
          columns={sortableColumns}
          onSort={mockOnSort}
        />
      )
      
      const nameHeader = screen.getByText('姓名').closest('th')
      fireEvent.click(nameHeader!)
      
      await waitFor(() => {
        expect(mockOnSort).toHaveBeenCalledWith('name', 'asc')
      })
    })
  })
})