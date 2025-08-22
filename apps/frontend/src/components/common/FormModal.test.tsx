import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { FormModal } from './FormModal'

const mockProps = {
  title: '測試表單',
  open: true,
  onClose: vi.fn(),
}

describe('FormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('應該正確渲染標題和內容', () => {
      render(
        <FormModal {...mockProps}>
          <div>表單內容</div>
        </FormModal>
      )
      
      expect(screen.getByText('測試表單')).toBeInTheDocument()
      expect(screen.getByText('表單內容')).toBeInTheDocument()
    })

    it('開啟狀態為 false 時不應該渲染', () => {
      render(
        <FormModal {...mockProps} open={false}>
          <div>表單內容</div>
        </FormModal>
      )
      
      expect(screen.queryByText('測試表單')).not.toBeInTheDocument()
    })

    it('應該渲染關閉按鈕', () => {
      render(
        <FormModal {...mockProps}>
          <div>表單內容</div>
        </FormModal>
      )
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('關閉功能', () => {
    it('點擊關閉按鈕應該觸發 onClose', () => {
      render(
        <FormModal {...mockProps}>
          <div>表單內容</div>
        </FormModal>
      )
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)
      
      expect(mockProps.onClose).toHaveBeenCalledOnce()
    })

    it('按 ESC 鍵應該觸發 onClose (當 escClosable 為 true)', () => {
      render(
        <FormModal {...mockProps} escClosable={true}>
          <div>表單內容</div>
        </FormModal>
      )
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(mockProps.onClose).toHaveBeenCalledOnce()
    })

    it('當 escClosable 為 false 時按 ESC 鍵不應該觸發 onClose', () => {
      render(
        <FormModal {...mockProps} escClosable={false}>
          <div>表單內容</div>
        </FormModal>
      )
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(mockProps.onClose).not.toHaveBeenCalled()
    })

    it('點擊遮罩應該觸發 onClose (當 maskClosable 為 true)', () => {
      render(
        <FormModal {...mockProps} maskClosable={true}>
          <div>表單內容</div>
        </FormModal>
      )
      
      const backdrop = screen.getByRole('dialog').parentElement
      fireEvent.click(backdrop!)
      
      expect(mockProps.onClose).toHaveBeenCalledOnce()
    })

    it('當 maskClosable 為 false 時點擊遮罩不應該觸發 onClose', () => {
      render(
        <FormModal {...mockProps} maskClosable={false}>
          <div>表單內容</div>
        </FormModal>
      )
      
      const backdrop = screen.getByRole('dialog').parentElement
      fireEvent.click(backdrop!)
      
      expect(mockProps.onClose).not.toHaveBeenCalled()
    })
  })

  describe('表單操作', () => {
    it('應該渲染默認的確認和取消按鈕', () => {
      render(
        <FormModal {...mockProps}>
          <div>表單內容</div>
        </FormModal>
      )
      
      expect(screen.getByRole('button', { name: '確認' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    })

    it('應該支援自定義按鈕文字', () => {
      render(
        <FormModal 
          {...mockProps} 
          confirmText="儲存" 
          cancelText="關閉"
        >
          <div>表單內容</div>
        </FormModal>
      )
      
      expect(screen.getByRole('button', { name: '儲存' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '關閉' })).toBeInTheDocument()
    })

    it('點擊取消按鈕應該觸發 onCancel 或 onClose', () => {
      const mockOnCancel = vi.fn()
      
      render(
        <FormModal {...mockProps} onCancel={mockOnCancel}>
          <div>表單內容</div>
        </FormModal>
      )
      
      const cancelButton = screen.getByRole('button', { name: '取消' })
      fireEvent.click(cancelButton)
      
      expect(mockOnCancel).toHaveBeenCalledOnce()
    })

    it('點擊確認按鈕應該觸發 onConfirm', () => {
      const mockOnConfirm = vi.fn()
      
      render(
        <FormModal {...mockProps} onConfirm={mockOnConfirm}>
          <div>表單內容</div>
        </FormModal>
      )
      
      const confirmButton = screen.getByRole('button', { name: '確認' })
      fireEvent.click(confirmButton)
      
      expect(mockOnConfirm).toHaveBeenCalledOnce()
    })

    it('載入狀態時應該顯示載入指示器', () => {
      render(
        <FormModal {...mockProps} confirmLoading={true}>
          <div>表單內容</div>
        </FormModal>
      )
      
      expect(screen.getByText('處理中...')).toBeInTheDocument()
      const confirmButton = screen.getByRole('button', { name: /處理中/ })
      expect(confirmButton).toBeDisabled()
    })

    it('禁用狀態時確認按鈕應該被禁用', () => {
      render(
        <FormModal {...mockProps} confirmDisabled={true}>
          <div>表單內容</div>
        </FormModal>
      )
      
      const confirmButton = screen.getByRole('button', { name: '確認' })
      expect(confirmButton).toBeDisabled()
    })
  })

  describe('表單提交', () => {
    it('應該支援表單提交', () => {
      const mockOnSubmit = vi.fn((e) => e.preventDefault())
      
      render(
        <FormModal {...mockProps} onSubmit={mockOnSubmit}>
          <input type="text" />
        </FormModal>
      )
      
      const form = screen.getByRole('form')
      fireEvent.submit(form)
      
      expect(mockOnSubmit).toHaveBeenCalledOnce()
    })

    it('當設定 onSubmit 時確認按鈕應該是 submit 類型', () => {
      const mockOnSubmit = vi.fn()
      
      render(
        <FormModal {...mockProps} onSubmit={mockOnSubmit}>
          <input type="text" />
        </FormModal>
      )
      
      const confirmButton = screen.getByRole('button', { name: '確認' })
      expect(confirmButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('尺寸設定', () => {
    it('應該支援不同尺寸', () => {
      const { rerender } = render(
        <FormModal {...mockProps} size="sm">
          <div>表單內容</div>
        </FormModal>
      )
      
      let modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('max-w-md')
      
      rerender(
        <FormModal {...mockProps} size="lg">
          <div>表單內容</div>
        </FormModal>
      )
      
      modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('max-w-2xl')
    })

    it('默認尺寸應該是 md', () => {
      render(
        <FormModal {...mockProps}>
          <div>表單內容</div>
        </FormModal>
      )
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('max-w-lg')
    })
  })

  describe('自定義footer', () => {
    it('應該支援自定義 footer', () => {
      render(
        <FormModal 
          {...mockProps} 
          footer={<button>自定義按鈕</button>}
        >
          <div>表單內容</div>
        </FormModal>
      )
      
      expect(screen.getByRole('button', { name: '自定義按鈕' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '確認' })).not.toBeInTheDocument()
    })

    it('應該支援隱藏 footer', () => {
      render(
        <FormModal {...mockProps} hideFooter={true}>
          <div>表單內容</div>
        </FormModal>
      )
      
      expect(screen.queryByRole('button', { name: '確認' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '取消' })).not.toBeInTheDocument()
    })
  })

  describe('樣式和類名', () => {
    it('應該支援自定義類名', () => {
      render(
        <FormModal {...mockProps} className="custom-modal">
          <div>表單內容</div>
        </FormModal>
      )
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('custom-modal')
    })
  })

  describe('焦點管理', () => {
    it('開啟時應該鎖定 body 滾動', () => {
      render(
        <FormModal {...mockProps}>
          <div>表單內容</div>
        </FormModal>
      )
      
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('關閉時應該恢復 body 滾動', () => {
      const { unmount } = render(
        <FormModal {...mockProps}>
          <div>表單內容</div>
        </FormModal>
      )
      
      unmount()
      
      expect(document.body.style.overflow).toBe('unset')
    })
  })

  describe('鍵盤導航', () => {
    it('應該支援 Tab 鍵在按鈕間切換', () => {
      render(
        <FormModal {...mockProps}>
          <input type="text" />
        </FormModal>
      )
      
      const input = screen.getByRole('textbox')
      const cancelButton = screen.getByRole('button', { name: '取消' })
      const confirmButton = screen.getByRole('button', { name: '確認' })
      
      input.focus()
      fireEvent.keyDown(input, { key: 'Tab' })
      
      expect(cancelButton).toHaveFocus()
      
      fireEvent.keyDown(cancelButton, { key: 'Tab' })
      
      expect(confirmButton).toHaveFocus()
    })
  })
})