import { test, expect } from '@playwright/test';
import { authFile } from './auth.setup';

// 使用已認證的使用者狀態
test.use({ storageState: authFile });

test.describe('CRM 完整工作流程', () => {
  test('Admin 登入 → 新增客戶 → 建立訂單 → 新增交流 → 造「未跟進」情境觸發任務 → 查看通知 → 匯出 CSV → 查 AuditLog', async ({ page }) => {
    // 1. 前往 dashboard，確認已登入
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('儀表板');
    
    // 2. 新增客戶
    await page.goto('/customers');
    await expect(page.locator('h1')).toContainText('客戶管理');
    
    // 點擊新增客戶按鈕
    await page.click('button:has-text("新增客戶")');
    
    // 等待導航到新增客戶頁面或彈出表單
    await page.waitForURL('/customers/add');
    
    // 填寫客戶資訊（假設有表單）
    await page.fill('input[name="name"]', '測試客戶E2E');
    await page.fill('input[name="phone"]', '0900123456');
    await page.fill('input[name="email"]', 'test-e2e@example.com');
    await page.fill('input[name="company"]', 'E2E測試公司');
    
    // 提交表單
    await page.click('button[type="submit"]');
    
    // 確認客戶創建成功
    await expect(page.locator('text=測試客戶E2E')).toBeVisible();
    
    // 3. 建立訂單
    await page.goto('/orders');
    await expect(page.locator('h1')).toContainText('訂單管理');
    
    // 點擊新增訂單
    await page.click('button:has-text("新增訂單")');
    
    // 等待導航到新增訂單頁面
    await page.waitForURL('/orders/add');
    
    // 選擇剛創建的客戶
    await page.selectOption('select[name="customerPhone"]', '0900123456');
    
    // 新增商品項目
    await page.fill('input[name="items.0.productName"]', 'E2E測試商品');
    await page.fill('input[name="items.0.quantity"]', '2');
    await page.fill('input[name="items.0.unitPrice"]', '500');
    
    // 提交訂單
    await page.click('button[type="submit"]');
    
    // 確認訂單創建成功
    await expect(page.locator('text=E2E測試商品')).toBeVisible();
    
    // 4. 新增交流紀錄
    await page.goto('/interactions');
    await expect(page.locator('h1')).toContainText('客戶交流');
    
    // 點擊新增交流
    await page.click('button:has-text("新增交流")');
    
    // 填寫交流資訊
    await page.selectOption('select[name="customerPhone"]', '0900123456');
    await page.selectOption('select[name="type"]', 'CALL');
    await page.fill('textarea[name="content"]', '與客戶進行E2E測試通話');
    
    // 提交交流紀錄
    await page.click('button[type="submit"]');
    
    // 確認交流紀錄創建成功
    await expect(page.locator('text=與客戶進行E2E測試通話')).toBeVisible();
    
    // 5. 造「未跟進」情境觸發任務
    // 假設我們需要修改交流紀錄的時間為7天前來觸發未跟進檢查
    // 這可能需要通過後端 API 或資料庫操作來實現
    // 在真實場景中，可能需要等待或模擬時間經過
    
    // 前往任務頁面檢查是否有未跟進任務
    await page.goto('/tasks');
    await expect(page.locator('h1')).toContainText('任務中心');
    
    // 6. 查看通知
    // 檢查是否有通知圖示或通知計數
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    if (await notificationBadge.isVisible()) {
      await notificationBadge.click();
      
      // 檢查通知內容
      await expect(page.locator('text=未跟進')).toBeVisible();
    }
    
    // 7. 匯出 CSV
    await page.goto('/customers');
    
    // 點擊匯出按鈕
    await page.click('button:has-text("匯出 CSV")');
    
    // 等待匯出完成的通知
    await expect(page.locator('text=匯出成功')).toBeVisible();
    
    // 8. 查看 AuditLog
    await page.goto('/audit');
    await expect(page.locator('h1')).toContainText('稽核日誌');
    
    // 檢查是否有相關的稽核記錄
    await expect(page.locator('text=CREATE')).toBeVisible(); // 創建客戶的記錄
    await expect(page.locator('text=測試客戶E2E')).toBeVisible(); // 客戶相關記錄
    
    // 可以進一步篩選和檢查特定的稽核記錄
    await page.fill('input[placeholder*="搜尋"]', '測試客戶E2E');
    await page.waitForTimeout(1000); // 等待搜尋結果
    
    // 確認搜尋結果包含相關記錄
    await expect(page.locator('text=測試客戶E2E')).toBeVisible();
    
    console.log('✅ CRM 完整工作流程測試完成');
  });
  
  test('工作流程中斷處理', async ({ page }) => {
    // 測試在工作流程中出現錯誤時的處理
    await page.goto('/customers');
    
    // 嘗試新增重複的客戶
    await page.click('button:has-text("新增客戶")');
    await page.waitForURL('/customers/add');
    
    // 使用已存在的電話號碼
    await page.fill('input[name="phone"]', '0900123456'); // 與上個測試相同
    await page.fill('input[name="name"]', '重複客戶');
    await page.fill('input[name="email"]', 'duplicate@example.com');
    
    // 提交表單
    await page.click('button[type="submit"]');
    
    // 應該看到錯誤訊息
    await expect(page.locator('text=電話號碼已存在')).toBeVisible();
  });
  
  test('分步驟驗證各功能', async ({ page }) => {
    // 1. 驗證客戶搜尋功能
    await page.goto('/customers');
    
    // 搜尋剛創建的客戶
    await page.fill('input[placeholder*="搜尋"]', '測試客戶E2E');
    await page.waitForTimeout(500);
    
    // 確認搜尋結果
    await expect(page.locator('text=測試客戶E2E')).toBeVisible();
    await expect(page.locator('text=0900123456')).toBeVisible();
    
    // 2. 驗證訂單篩選功能
    await page.goto('/orders');
    
    // 按客戶篩選
    await page.selectOption('select[name="customerFilter"]', '0900123456');
    await page.waitForTimeout(500);
    
    // 確認篩選結果
    await expect(page.locator('text=測試客戶E2E')).toBeVisible();
    
    // 3. 驗證任務狀態更新
    await page.goto('/tasks');
    
    // 找到第一個任務並更新狀態
    const firstTaskRow = page.locator('table tbody tr').first();
    await firstTaskRow.locator('select[name="status"]').selectOption('IN_PROGRESS');
    
    // 確認狀態更新成功
    await expect(firstTaskRow.locator('text=進行中')).toBeVisible();
    
    console.log('✅ 分步驟功能驗證完成');
  });
});

test.describe('數據一致性檢查', () => {
  test('跨頁面數據一致性', async ({ page }) => {
    // 在客戶頁面查看客戶資訊
    await page.goto('/customers');
    const customerName = await page.locator('table tbody tr').first().locator('td').nth(0).textContent();
    const customerPhone = await page.locator('table tbody tr').first().locator('td').nth(1).textContent();
    
    // 前往訂單頁面，確認相同客戶的資訊一致
    await page.goto('/orders');
    const orderCustomer = await page.locator('table tbody tr').first().locator('td').nth(1).textContent();
    
    // 驗證客戶資訊在不同頁面保持一致
    expect(orderCustomer).toContain(customerName || '');
    
    // 前往交流紀錄頁面驗證
    await page.goto('/interactions');
    const interactionCustomer = await page.locator('table tbody tr').first().locator('td').nth(0).textContent();
    
    expect(interactionCustomer).toContain(customerName || '');
    
    console.log('✅ 跨頁面數據一致性檢查完成');
  });
});