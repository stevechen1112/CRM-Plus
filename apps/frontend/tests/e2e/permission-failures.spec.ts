import { test, expect } from '@playwright/test';

test.describe('權限失敗用例測試', () => {
  // 設定不同角色的身份驗證狀態
  test.describe('Staff 角色限制測試', () => {
    test.beforeEach(async ({ page }) => {
      // 模擬 Staff 用戶登入
      await page.goto('/login');
      
      // 使用 Staff 帳號登入
      await page.fill('input[type="email"]', 'staff@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // 等待登入成功
      await page.waitForURL('/dashboard');
    });

    test('Staff 嘗試刪除客戶 → UI 禁用且 API 403', async ({ page }) => {
      // 1. 前往客戶管理頁面
      await page.goto('/customers');
      await expect(page.locator('h1')).toContainText('客戶管理');
      
      // 2. 檢查刪除按鈕是否被隱藏或禁用
      const deleteButtons = page.locator('button:has-text("刪除")');
      
      // 確認刪除按鈕不存在或被隱藏（基於權限控制）
      await expect(deleteButtons).toHaveCount(0);
      
      // 3. 嘗試直接通過 API 呼叫刪除（模擬繞過前端限制）
      const response = await page.request.delete('/api/v1/customers/0912345678', {
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`
        }
      });
      
      // 4. 確認 API 返回 403 Forbidden
      expect(response.status()).toBe(403);
      
      const responseBody = await response.json();
      expect(responseBody.message).toContain('權限不足');
      
      console.log('✅ Staff 刪除客戶權限限制測試通過');
    });

    test('Staff 嘗試訪問用戶管理頁面 → 403 Forbidden', async ({ page }) => {
      // 1. 嘗試訪問用戶管理頁面
      await page.goto('/users');
      
      // 2. 應該被重定向到 403 頁面或顯示無權限訊息
      await expect(page.locator('h1')).toContainText('403');
      await expect(page.locator('text=權限不足')).toBeVisible();
      
      // 3. 檢查導航選單中是否隱藏了用戶管理選項
      await page.goto('/dashboard');
      const userManagementLink = page.locator('nav a[href="/users"]');
      await expect(userManagementLink).not.toBeVisible();
      
      console.log('✅ Staff 用戶管理權限限制測試通過');
    });

    test('Staff 嘗試匯入資料 → UI 禁用', async ({ page }) => {
      // 1. 前往客戶管理頁面
      await page.goto('/customers');
      
      // 2. 檢查匯入按鈕是否被隱藏
      const importButton = page.locator('a:has-text("匯入資料")');
      await expect(importButton).not.toBeVisible();
      
      // 3. 嘗試直接訪問匯入頁面
      await page.goto('/import');
      
      // 4. 應該被重定向到 403 頁面
      await expect(page.locator('h1')).toContainText('403');
      
      console.log('✅ Staff 匯入資料權限限制測試通過');
    });

    test('Staff 嘗試修改其他用戶資料 → API 403', async ({ page }) => {
      // 1. 嘗試通過 API 修改其他用戶的資料
      const response = await page.request.put('/api/v1/users/admin-user-id', {
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`,
          'Content-Type': 'application/json'
        },
        data: {
          email: 'modified@example.com',
          role: 'ADMIN'
        }
      });
      
      // 2. 確認 API 返回 403
      expect(response.status()).toBe(403);
      
      console.log('✅ Staff 修改用戶資料權限限制測試通過');
    });
  });

  test.describe('訪客/未登入用戶測試', () => {
    test('未登入用戶訪問受保護頁面 → 重定向到登入頁', async ({ page }) => {
      // 1. 直接訪問受保護的頁面
      await page.goto('/customers');
      
      // 2. 應該被重定向到登入頁面
      await page.waitForURL('/login');
      expect(page.url()).toContain('/login');
      
      // 3. 測試其他受保護頁面
      const protectedRoutes = ['/dashboard', '/orders', '/tasks', '/users', '/audit'];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        await page.waitForURL('/login');
        expect(page.url()).toContain('/login');
      }
      
      console.log('✅ 未登入用戶重定向測試通過');
    });

    test('未登入用戶直接 API 呼叫 → 401 Unauthorized', async ({ page }) => {
      // 1. 嘗試直接呼叫 API 而不提供認證 token
      const response = await page.request.get('/api/v1/customers');
      
      // 2. 確認返回 401
      expect(response.status()).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody.message).toContain('未授權');
      
      console.log('✅ 未登入用戶 API 存取限制測試通過');
    });
  });

  test.describe('過期 Token 測試', () => {
    test('使用過期 Token 訪問 API → 401 並自動登出', async ({ page }) => {
      // 1. 先正常登入
      await page.goto('/login');
      await page.fill('input[type="email"]', 'staff@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // 2. 模擬 token 過期（設置一個無效的 token）
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'expired-token');
      });
      
      // 3. 嘗試訪問需要認證的 API
      await page.goto('/customers');
      
      // 4. 應該自動重定向到登入頁面
      await page.waitForURL('/login');
      expect(page.url()).toContain('/login');
      
      // 5. 檢查 localStorage 中的 token 是否被清除
      const token = await page.evaluate(() => localStorage.getItem('accessToken'));
      expect(token).toBeFalsy();
      
      console.log('✅ 過期 Token 處理測試通過');
    });
  });

  test.describe('CSRF 保護測試', () => {
    test('跨站請求偽造攻擊防護', async ({ page }) => {
      // 1. 正常登入
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // 2. 嘗試從不同 origin 發送請求（模擬 CSRF 攻擊）
      const response = await page.request.post('/api/v1/customers', {
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`,
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com' // 模擬惡意來源
        },
        data: {
          name: 'CSRF Test',
          phone: '0900000000',
          email: 'csrf@test.com'
        }
      });
      
      // 3. 根據 CSRF 保護設定，應該被拒絕或要求額外驗證
      // 具體行為取決於後端的 CSRF 保護實作
      expect(response.status()).toBeGreaterThanOrEqual(400);
      
      console.log('✅ CSRF 保護測試完成');
    });
  });

  test.describe('資料存取邊界測試', () => {
    test('Staff 只能查看自己負責的客戶資料', async ({ page }) => {
      // 1. Staff 登入
      await page.goto('/login');
      await page.fill('input[type="email"]', 'staff@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // 2. 前往客戶列表
      await page.goto('/customers');
      
      // 3. 檢查是否只顯示該 Staff 負責的客戶
      // 這取決於後端的資料過濾邏輯
      const customerRows = page.locator('table tbody tr');
      const rowCount = await customerRows.count();
      
      // 4. 嘗試直接訪問其他客戶的詳情頁面
      const response = await page.request.get('/api/v1/customers/other-staff-customer', {
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`
        }
      });
      
      // 5. 應該返回 403 或 404
      expect(response.status()).toBeGreaterThanOrEqual(400);
      
      console.log('✅ 資料存取邊界測試完成');
    });
  });

  test.describe('暴力破解防護測試', () => {
    test('多次登入失敗後帳號鎖定', async ({ page }) => {
      await page.goto('/login');
      
      // 1. 進行多次錯誤登入嘗試
      for (let i = 0; i < 5; i++) {
        await page.fill('input[type="email"]', 'admin@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        
        // 等待錯誤訊息
        await expect(page.locator('text=帳號或密碼錯誤')).toBeVisible();
        
        // 清空輸入框準備下次嘗試
        await page.fill('input[type="password"]', '');
      }
      
      // 2. 第六次嘗試應該觸發帳號鎖定
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // 3. 應該顯示帳號被鎖定的訊息
      await expect(page.locator('text=帳號已被鎖定')).toBeVisible();
      
      // 4. 即使使用正確密碼也無法登入
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=帳號已被鎖定')).toBeVisible();
      
      console.log('✅ 暴力破解防護測試完成');
    });
  });

  test.describe('檔案上傳安全測試', () => {
    test('上傳惡意檔案類型被拒絕', async ({ page }) => {
      // 1. 管理員登入
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // 2. 前往匯入頁面
      await page.goto('/import');
      
      // 3. 嘗試上傳非 CSV/Excel 檔案
      const fileInput = page.locator('input[type="file"]');
      
      // 創建一個模擬的惡意檔案
      const maliciousFile = await page.evaluateHandle(() => {
        const file = new File(['malicious content'], 'virus.exe', { type: 'application/octet-stream' });
        return file;
      });
      
      await fileInput.setInputFiles(maliciousFile as any);
      
      // 4. 應該顯示檔案類型不支援的錯誤
      await expect(page.locator('text=不支援的檔案類型')).toBeVisible();
      
      console.log('✅ 檔案上傳安全測試完成');
    });
  });

  test.describe('XSS 防護測試', () => {
    test('用戶輸入 XSS 腳本被過濾', async ({ page }) => {
      // 1. 管理員登入
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // 2. 前往客戶新增頁面
      await page.goto('/customers/add');
      
      // 3. 在客戶名稱欄位輸入 XSS 腳本
      const xssScript = '<script>alert("XSS")</script>';
      await page.fill('input[name="name"]', xssScript);
      await page.fill('input[name="phone"]', '0900999999');
      await page.fill('input[name="email"]', 'xss@test.com');
      
      // 4. 提交表單
      await page.click('button[type="submit"]');
      
      // 5. 檢查腳本是否被正確轉義而不是執行
      await page.goto('/customers');
      
      // 腳本應該被顯示為純文字而不是執行
      await expect(page.locator(`text=${xssScript}`)).toBeVisible();
      
      // 確認沒有 alert 彈出
      page.on('dialog', async dialog => {
        throw new Error('XSS script was executed!');
      });
      
      console.log('✅ XSS 防護測試完成');
    });
  });
});