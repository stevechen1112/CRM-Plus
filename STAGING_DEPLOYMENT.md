# Staging 部署指引（與 Prod 同構）

## 基礎設施選項（選一即可）
- **Container Platform**: Cloud Run / ECS Fargate / Fly.io / Railway
- **Database**: Managed Postgres（Cloud SQL/RDS）
- **Cache**: Managed Redis（MemoryStore/ElastiCache/Upstash）
- **Storage**: 物件儲存（S3/GCS）供匯出檔案與日誌歸檔

## 容器產物
- **後端**: 走 `nest build` 產生 `dist/`，不要用 `tsx/transpile-only`
- **前端**: `vite build`，交由 CDN/反代（CloudFront/Cloudflare）或 Nginx 服務靜態檔

## 環境變數
```bash
# Core
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# Auth
JWT_SECRET=staging-secret-key
REFRESH_TOKEN_SECRET=staging-refresh-secret
JWT_EXPIRES_IN=24h

# Features
ENABLE_SWAGGER=true  # Staging 才開

# Security
FRONTEND_URL=https://staging.crm.com
CORS_ORIGINS=https://staging.crm.com

# SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx
```

## 安全基線
- [ ] Helmet + CSP
- [ ] Rate limit
- [ ] WAF（Cloudflare/ALB）
- [ ] 嚴格 CORS 白名單與 HTTPS 強制
- [ ] 匯入/匯出與刪除類功能限 Admin/Manager
- [ ] 操作二次確認
- [ ] AuditLog 保存策略

## 可觀測性
- [ ] 結構化 JSON 日誌（含 request_id）
- [ ] 健康檢查/就緒檢查（readinessProbe/livenessProbe）
- [ ] 指標監控：
  - 延遲、5xx 率
  - DB 連線池
  - BullMQ 任務延遲/死信
- [ ] 備份：Postgres 自動快照 + 每日匯出
- [ ] 還原流程演練

## Docker Compose for Staging
```yaml
version: '3.8'

services:
  backend:
    image: crm-backend:staging
    environment:
      NODE_ENV: staging
      ENABLE_SWAGGER: true
    command: ["npm", "run", "start:prod"]
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8080/api/v1/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
    profiles: ["staging"]

  frontend:
    image: crm-frontend:staging
    environment:
      NODE_ENV: production
    profiles: ["staging"]
```