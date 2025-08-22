import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// 設定模擬服務器
export const server = setupServer(...handlers)