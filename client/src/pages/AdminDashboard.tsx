// src/pages/AdminDashboard.tsx

import { useState, useEffect, useCallback } from 'react'
import { adminApi, Analytics, Vendor, Product, Order, AuditLog } from '../api/admin'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'vendors' | 'products' | 'orders' | 'users' | 'audit'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'bg-green-100 text-green-800',
  PENDING:   'bg-amber-100 text-amber-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  REJECTED:  'bg-red-100 text-red-800',
  DELIVERED: 'bg-green-100 text-green-800',
  SHIPPED:   'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PROCESSING:'bg-amber-100 text-amber-800',
}

const Badge = ({ status }: { status: string }) => (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}>
    {status}
  </span>
)

const MetricCard = ({
  label,
  value,
  sub,
  trend,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down'
}) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-medium text-gray-900">{value}</p>
    {sub && (
      <p className={`text-xs mt-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
        {sub}
      </p>
    )}
  </div>
)

// ─── Mini bar chart ───────────────────────────────────────────────────────────

const BarChart = ({ data }: { data: { day: string; count: number }[] }) => {
  const max = Math.max(...data.map((d) => d.count), 1)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-green-200 hover:bg-green-500 rounded-t transition-colors cursor-default"
            style={{ height: `${Math.round((d.count / max) * 72)}px` }}
            title={`${d.count} orders`}
          />
          <span className="text-[9px] text-gray-400">{days[i] ?? ''}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Vendors tab ─────────────────────────────────────────────────────────────

const VendorsTab = () => {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi.getVendors({ search, status: statusFilter || undefined })
      setVendors(data.vendors)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: Vendor['status']) => {
    await adminApi.updateVendorStatus(id, status)
    load()
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-800">Vendors ({total})</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 h-8 w-40 focus:outline-none focus:ring-1 focus:ring-green-400"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 h-8 focus:outline-none"
          >
            <option value="">All status</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 py-4 text-center">Loading...</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Vendor</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Email</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Products</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Orders</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Status</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 px-2 font-medium text-gray-800">{v.storeName}</td>
                <td className="py-2.5 px-2 text-gray-500">{v.user.email}</td>
                <td className="py-2.5 px-2">{v._count.products}</td>
                <td className="py-2.5 px-2">{v._count.orders}</td>
                <td className="py-2.5 px-2"><Badge status={v.status} /></td>
                <td className="py-2.5 px-2">
                  <div className="flex gap-1">
                    {v.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateStatus(v.id, 'ACTIVE')}
                          className="px-2 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200 font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(v.id, 'REJECTED')}
                          className="px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {v.status === 'ACTIVE' && (
                      <button
                        onClick={() => updateStatus(v.id, 'SUSPENDED')}
                        className="px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                      >
                        Suspend
                      </button>
                    )}
                    {v.status === 'SUSPENDED' && (
                      <button
                        onClick={() => updateStatus(v.id, 'ACTIVE')}
                        className="px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Products tab ─────────────────────────────────────────────────────────────

const ProductsTab = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi.getProducts({ status: statusFilter || undefined })
      setProducts(data.products)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: Product['status']) => {
    await adminApi.updateProductStatus(id, status)
    load()
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-800">Products ({total})</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 h-8"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 py-4 text-center">Loading...</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Product</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Vendor</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Price</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Stock</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Status</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 px-2 font-medium text-gray-800">{p.name}</td>
                <td className="py-2.5 px-2 text-gray-500">{p.vendor.storeName}</td>
                <td className="py-2.5 px-2">${p.price.toFixed(2)}</td>
                <td className="py-2.5 px-2">{p.stock}</td>
                <td className="py-2.5 px-2"><Badge status={p.status} /></td>
                <td className="py-2.5 px-2">
                  {p.status === 'PENDING' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus(p.id, 'ACTIVE')}
                        className="px-2 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200 font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, 'REJECTED')}
                        className="px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Orders tab ───────────────────────────────────────────────────────────────

const OrdersTab = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getOrders().then((d) => {
      setOrders(d.orders)
      setTotal(d.total)
      setLoading(false)
    })
  }, [])

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h2 className="text-sm font-medium text-gray-800 mb-4">Orders ({total})</h2>
      {loading ? (
        <p className="text-xs text-gray-400 py-4 text-center">Loading...</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-2 text-gray-400 font-medium">ID</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Customer</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Vendor</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Total</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Channel</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Status</th>
              <th className="text-left py-2 px-2 text-gray-400 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 px-2 font-mono text-gray-400">#{o.id.slice(0, 8)}</td>
                <td className="py-2.5 px-2">{o.user.name}</td>
                <td className="py-2.5 px-2 text-gray-500">{o.vendor.storeName}</td>
                <td className="py-2.5 px-2 font-medium">${o.total.toFixed(2)}</td>
                <td className="py-2.5 px-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    o.channel === 'WHATSAPP'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {o.channel}
                  </span>
                </td>
                <td className="py-2.5 px-2"><Badge status={o.status} /></td>
                <td className="py-2.5 px-2 text-gray-400">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Audit Logs tab ───────────────────────────────────────────────────────────

const AuditTab = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getAuditLogs().then((d) => {
      setLogs(d.logs)
      setLoading(false)
    })
  }, [])

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h2 className="text-sm font-medium text-gray-800 mb-4">Audit Logs</h2>
      {loading ? (
        <p className="text-xs text-gray-400 py-4 text-center">Loading...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-2 h-2 rounded-full mt-1.5 bg-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-800">
                  <span className="font-medium">{log.user.name}</span>{' '}
                  performed <span className="font-mono bg-gray-100 px-1 rounded">{log.action}</span>{' '}
                  on <span className="font-medium">{log.entity}</span>
                </p>
              </div>
              <p className="text-xs text-gray-400 whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────

const OverviewTab = ({ analytics }: { analytics: Analytics | null }) => {
  if (!analytics) return <p className="text-xs text-gray-400">Loading analytics...</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Total Vendors" value={analytics.totalVendors} sub={`${analytics.pendingVendors} pending`} />
        <MetricCard label="Customers" value={analytics.totalCustomers.toLocaleString()} />
        <MetricCard label="Orders (total)" value={analytics.totalOrders.toLocaleString()} />
        <MetricCard label="Revenue (USD)" value={`$${analytics.totalRevenue.toLocaleString()}`} trend="up" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-xs font-medium text-gray-600 mb-3">Orders — Last 7 Days</h3>
          {analytics.ordersLast7Days.length > 0 ? (
            <BarChart data={analytics.ordersLast7Days} />
          ) : (
            <p className="text-xs text-gray-400">No data yet</p>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-xs font-medium text-gray-600 mb-3">Top Vendors</h3>
          <div className="flex flex-col gap-2">
            {analytics.topVendors.map((v) => (
              <div key={v.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-100 text-green-800 text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                  {v.storeName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-800">{v.storeName}</p>
                  <p className="text-[10px] text-gray-400">{v.orderCount} orders · {v.productCount} products</p>
                </div>
                <p className="text-xs font-medium text-gray-700">${v.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  useEffect(() => {
    adminApi.getAnalytics().then(setAnalytics).catch(console.error)
  }, [])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'vendors', label: `Vendors${analytics ? ` (${analytics.pendingVendors} pending)` : ''}` },
    { key: 'products', label: 'Products' },
    { key: 'orders', label: 'Orders' },
    { key: 'users', label: 'Users' },
    { key: 'audit', label: 'Audit Logs' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-48 bg-[#1A2E0A] flex flex-col flex-shrink-0">
        <div className="px-4 py-5 border-b border-white/10">
          <p className="text-[#C8D8A8] font-medium text-base">SouQna</p>
          <p className="text-[#C8D8A8]/40 text-xs mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 p-2 pt-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-0.5 transition-colors ${
                tab === t.key
                  ? 'bg-[#4A7C1F]/40 text-[#C8D8A8]'
                  : 'text-[#C8D8A8]/50 hover:bg-white/5 hover:text-[#C8D8A8]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-[#C8D8A8]/50 text-xs">Admin</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 h-13 flex items-center justify-between">
          <h1 className="text-sm font-medium text-gray-900 capitalize">{tab}</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'overview'  && <OverviewTab analytics={analytics} />}
          {tab === 'vendors'   && <VendorsTab />}
          {tab === 'products'  && <ProductsTab />}
          {tab === 'orders'    && <OrdersTab />}
          {tab === 'audit'     && <AuditTab />}
          {tab === 'users'     && <p className="text-xs text-gray-400">Users tab — same pattern as vendors</p>}
        </div>
      </main>
    </div>
  )
}