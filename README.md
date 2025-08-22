# CRM System - SaaS 客戶關係管理系統

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

一套專為中小企業團隊內部使用的輕量級 SaaS CRM 系統，支援多人協作、客戶管理、訂單追蹤、交流紀錄和任務自動化。

## 🚀 快速開始

### 環境需求

- Node.js >= 18.0.0
- Docker & Docker Compose
- PostgreSQL >= 14 (若不使用 Docker)
- Redis >= 6.0 (若不使用 Docker)

### 一鍵啟動 (推薦)

```bash
# 1. 複製專案
git clone <repository-url>
cd CRM

# 2. 複製環境變數
cp .env.example .env

# 3. 啟動所有服務
npm run dev
```

這會啟動：
- 🗄️ PostgreSQL 資料庫 (localhost:5432)
- 🔴 Redis 快取 (localhost:6379)
- 🖥️ PgAdmin 資料庫管理介面 (localhost:5050)
- 📧 MailHog 郵件測試 (localhost:8025)
- 🚀 後端 API (localhost:8080)
- 💻 前端應用 (localhost:3000)

### 手動安裝（開發用）

```bash
# 安裝依賴
npm install

# 建立資料庫
npm run db:migrate

# 初始化種子資料
npm run db:seed

# 分別啟動服務
npm run dev:backend  # 後端 (localhost:8080)
npm run dev:frontend # 前端 (localhost:3000)
```

## 📖 服務介面

| 服務 | URL | 說明 |
|------|-----|------|
| 前端應用 | http://localhost:3000 | React 前端界面 |
| 後端 API | http://localhost:8080 | NestJS REST API |
| API 文檔 | http://localhost:8080/docs | Swagger 文檔 |
| 資料庫管理 | http://localhost:5050 | PgAdmin 管理介面 |
| 郵件測試 | http://localhost:8025 | MailHog 測試信箱 |

## 🔑 預設帳號

| 角色 | 帳號 | 密碼 |
|------|------|------|
| 管理員 | admin@crm.com | admin123 |
| 業務員 | sales1@crm.com | sales123 |
| 業務員 | sales2@crm.com | sales123 |

## 🎯 核心功能

### 🔄 多人協作
- 團隊成員共享客戶資訊
- 角色權限管理 (管理員/經理/業務/支援)
- 操作日誌完整追蹤

### 📱 手機號碼主鍵
- 以手機號碼為客戶唯一識別 (符合台灣商業習慣)
- 支援台灣手機格式：09xxxxxxxx
- Email、LINE ID、Facebook 為次要識別

### 🤖 智能去重合併
- 手機號碼相同：自動合併
- 姓名相似：人工審核確認
- 完整合併審計軌跡

### ⚡ 任務自動化
智能提醒規則（可調整）：
- 新名單 24 小時未跟進 → 建立跟進任務
- 潛客 7 天 / 熟客 90 天無互動 → 建立關懷任務
- 成交後 D+3 關懷 / D+30 回購提醒
- 逾期付款、生日週年提醒

### 📊 RFM 客戶分析
- 自動計算 RFM 分數 (最近購買、頻率、金額)
- 客戶自動分群：冠軍客戶、忠誠客戶、潛力客戶等
- 個人化行銷建議

### 🔒 完整稽核
- 登入 IP 和時間記錄
- 所有 CRUD 操作追蹤 (who/when/what/where)
- 客戶合併完整審計軌跡
- 匯入操作日誌

## 🏗️ 技術架構

### 前端技術棧
- **React 18** + **TypeScript** - 現代化前端框架
- **Vite** - 快速建構工具
- **TailwindCSS** - 實用優先的 CSS 框架
- **React Query** - 伺服器狀態管理
- **React Hook Form** - 高效能表單處理

### 後端技術棧
- **Node.js** + **NestJS** - 企業級後端框架
- **PostgreSQL** - 主資料庫（支援 JSONB 擴充欄位）
- **Prisma ORM** - 類型安全的資料庫存取
- **Redis** - 快取和任務佇列
- **BullMQ** - 任務排程處理
- **JWT** - 身份驗證

### 基礎設施
- **Docker** + **Docker Compose** - 容器化部署
- **Swagger** - API 文檔自動生成
- **Jest** + **Vitest** + **Playwright** - 完整測試覆蓋

## 📋 主要模組

### 👥 客戶管理 (`/customers`)
- 手機號碼主鍵，支援次要聯絡方式
- 智能去重和合併功能
- 客戶標籤、來源、區域分類
- RFM 分析和客戶分群

### 🛒 訂單管理 (`/orders`)
- 完整訂單生命週期追蹤
- 商品明細、付款、交付狀態
- 客戶消費歷史分析

### 💬 交流紀錄 (`/interactions`)
- 多管道紀錄 (電話/Email/LINE/FB/面談)
- 結構化摘要 + 附件支援
- 客戶互動時間軸

### ✅ 任務中心 (`/tasks`)
- 手動任務建立和指派
- 自動化規則引擎
- 任務優先級和狀態管理

### 📁 匯入匯出 (`/import`, `/export`)
- CSV/Excel 批次匯入
- 智能欄位對應 (mapping)
- 匯入預檢和錯誤報告
- 資料匯出和備份

### 🔍 稽核系統 (`/audit`)
- 完整操作日誌
- 登入 IP 追蹤
- 資料變更軌跡

## 🧪 測試

```bash
# 執行所有測試
npm run test

# 單元測試
npm run test:backend
npm run test:frontend

# E2E 測試
npm run test:e2e

# 測試覆蓋率
npm run test:cov
```

## 🚢 部署

### Docker 部署 (推薦)
```bash
# 生產環境建置
docker-compose -f docker-compose.prod.yml up -d
```

### 資料庫管理
```bash
# 執行 migration
npm run db:migrate

# 重置資料庫
npm run db:reset

# 資料庫種子
npm run db:seed

# 打開 Prisma Studio
npm run db:studio
```

## 📊 效能監控

### 關鍵指標
- API 回應時間: < 500ms (P95)
- 系統可用性: > 99.9%
- 任務準時率: ≥ 95%
- 匯入成功率: ≥ 99%

### 日誌格式
所有操作日誌都採用結構化 JSON 格式，包含：
- `requestId`, `userId`, `userIp`
- `action`, `entity`, `entityId`
- `status`, `latencyMs`, `timestamp`

## 🔐 安全性

- **HTTPS 強制** - 所有連線加密
- **JWT 短期有效** - 降低令牌洩漏風險
- **密碼加密** - bcrypt 強化雜湊
- **輸入驗證** - 前後端雙重驗證 (Zod)
- **SQL 注入防護** - Prisma ORM 參數化查詢
- **CORS 設定** - 限制跨域請求
- **Rate Limiting** - API 請求頻率限制

## 📝 開發規範

### Git 工作流程
```bash
# 開發新功能
git checkout -b feature/your-feature-name
git commit -m "feat: add customer merge functionality"
git push origin feature/your-feature-name

# 程式碼檢查
npm run lint
npm run test
```

### API 設計規範
- RESTful 設計原則
- 統一錯誤回應格式
- OpenAPI 3.0 文檔
- 版本控制 (`/api/v1`)

## 🤝 貢獻指南

1. Fork 專案
2. 建立功能分支
3. 遵循程式碼規範
4. 撰寫測試
5. 提交 Pull Request

## 📞 支援

如有問題請查看：
- [技術文件](./docs/)
- [API 文檔](http://localhost:8080/docs)
- [Issue 追蹤](https://github.com/your-org/crm-system/issues)

---

**⭐ 如果這個專案對您有幫助，請給我們一個 Star！**