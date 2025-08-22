import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:8080/api/v1'

export const handlers = [
  // 認證相關
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'STAFF',
          isActive: true,
        },
      },
    })
  }),

  // 客戶相關
  http.get(`${API_BASE_URL}/customers`, () => {
    return HttpResponse.json({
      data: [
        {
          phone: '0912345678',
          name: '測試客戶',
          email: 'test@example.com',
          tags: ['測試'],
          region: '台北',
          marketingConsent: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    })
  }),

  http.get(`${API_BASE_URL}/customers/:phone`, ({ params }) => {
    return HttpResponse.json({
      phone: params.phone,
      name: '測試客戶',
      email: 'test@example.com',
      tags: ['測試'],
      region: '台北',
      marketingConsent: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    })
  }),

  http.post(`${API_BASE_URL}/customers`, () => {
    return HttpResponse.json({
      phone: '0912345678',
      name: '新客戶',
      email: 'new@example.com',
      tags: ['新客戶'],
      marketingConsent: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    }, { status: 201 })
  }),

  // 訂單相關
  http.get(`${API_BASE_URL}/orders`, () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          orderNo: 'ORD001',
          customerPhone: '0912345678',
          totalAmount: 1000,
          paymentStatus: 'PENDING',
          orderStatus: 'CONFIRMED',
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
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    })
  }),

  // 任務相關
  http.get(`${API_BASE_URL}/tasks`, () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          title: '測試任務',
          description: '測試任務描述',
          type: 'FOLLOW_UP',
          priority: 'MEDIUM',
          status: 'PENDING',
          customerPhone: '0912345678',
          assignedToId: '1',
          dueDate: '2023-12-31T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    })
  }),

  // 錯誤處理
  http.get(`${API_BASE_URL}/customers/error`, () => {
    return HttpResponse.json(
      { message: '客戶不存在' },
      { status: 404 }
    )
  }),

  http.delete(`${API_BASE_URL}/customers/:phone`, ({ params }) => {
    // 模擬權限檢查
    const authHeader = 'Bearer mock-token'
    if (!authHeader) {
      return HttpResponse.json(
        { message: '未授權' },
        { status: 401 }
      )
    }
    
    // 模擬角色檢查 - 假設 STAFF 沒有刪除權限
    const userRole = 'STAFF'
    if (userRole === 'STAFF') {
      return HttpResponse.json(
        { message: '權限不足' },
        { status: 403 }
      )
    }

    return HttpResponse.json({ success: true })
  }),
]