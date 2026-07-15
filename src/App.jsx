import { Link, Route, Routes } from 'react-router-dom'
import RequireAdmin from './components/RequireAdmin.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import ProductList from './pages/admin/ProductList.jsx'
import ProductForm from './pages/admin/ProductForm.jsx'
import ProductListPage from './pages/ProductListPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import CartPage from './pages/CartPage.jsx'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage.jsx'
import { useCart } from './contexts/CartContext.jsx'

function Header() {
  const { cartCount } = useCart()

  return (
    <header className="sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-[var(--text-h)] no-underline text-base">
          ec-app
        </Link>
        <Link
          to="/cart"
          className="flex items-center gap-1.5 no-underline text-[var(--text)] font-medium text-sm"
        >
          カート
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[var(--accent)] text-white text-xs">
            {cartCount}
          </span>
        </Link>
      </div>
    </header>
  )
}

function App() {
  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 box-border">
        <Routes>
          <Route path="/" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
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
      </main>
    </>
  )
}

export default App
