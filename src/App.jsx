import { Route, Routes } from 'react-router-dom'
import RequireAdmin from './components/RequireAdmin.jsx'
import Home from './Home.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import ProductList from './pages/admin/ProductList.jsx'
import ProductForm from './pages/admin/ProductForm.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/*"
        element={
          <RequireAdmin>
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<ProductList />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id/edit" element={<ProductForm />} />
            </Routes>
          </RequireAdmin>
        }
      />
    </Routes>
  )
}

export default App
