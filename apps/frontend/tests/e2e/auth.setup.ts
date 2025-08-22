import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // 執行身份驗證步驟
  await page.goto('/login');
  
  // 填寫登入表單
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'password123');
  
  // 提交表單
  await page.click('button[type="submit"]');
  
  // 等待登入成功，檢查是否重定向到 dashboard
  await page.waitForURL('/dashboard');
  
  // 確認登入成功
  await expect(page.locator('text=客戶管理')).toBeVisible();
  
  // 儲存身份驗證狀態到檔案
  await page.context().storageState({ path: authFile });
});

export { authFile };