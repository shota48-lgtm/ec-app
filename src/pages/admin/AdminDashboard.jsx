import { Link } from 'react-router-dom'

function AdminDashboard() {
  return (
    <div>
      <h1>管理者ダッシュボード</h1>
      <Link to="/admin/products">商品管理</Link>
      <br />
      <Link to="/admin/orders">注文管理</Link>
    </div>
  )
}

export default AdminDashboard
