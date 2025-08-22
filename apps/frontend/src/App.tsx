import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/common'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Customers from '@/pages/Customers'
import CustomerDetail from '@/pages/CustomerDetail'
import CustomerForm from '@/pages/CustomerForm'
import Orders from '@/pages/Orders'
import OrderDetail from '@/pages/OrderDetail'
import Tasks from '@/pages/Tasks'
import Import from '@/pages/Import'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import Users from '@/pages/Users'
import Audit from '@/pages/Audit'
import Forbidden from '@/pages/Forbidden'
import ProtectedRoute from '@/components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forbidden" element={<Forbidden />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* All roles can access these */}
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/add" element={<CustomerForm />} />
                    <Route path="/customers/:phone/edit" element={<CustomerForm />} />
                    <Route path="/customers/:phone" element={<CustomerDetail />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/:id" element={<OrderDetail />} />
                    <Route path="/tasks" element={<Tasks />} />
                    
                    {/* Admin and Manager only */}
                    <Route 
                      path="/import" 
                      element={
                        <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
                          <Import />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/reports" 
                      element={
                        <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
                          <Reports />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Admin only */}
                    <Route 
                      path="/users" 
                      element={
                        <ProtectedRoute requiredRoles={['ADMIN']}>
                          <Users />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/audit" 
                      element={
                        <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
                          <Audit />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute requiredRoles={['ADMIN']}>
                          <Settings />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App