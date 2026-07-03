import { useState, useEffect, useMemo } from 'react'
import { HiOutlineCurrencyDollar, HiOutlinePlus } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { formatMoney } from '../utils/formatMoney'
import { formatDateTime } from '../utils/formatDate'
import PrimaryButton from '../components/ui/PrimaryButton'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import RechargeWalletModal from '../components/customers/RechargeWalletModal'
import WalletCallRatesPanel from '../components/wallet/WalletCallRatesPanel'

export default function Wallet() {
  const { isMaster } = useAuth()
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState({ transactions: [], total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [customerFilter, setCustomerFilter] = useState('')
  const [search, setSearch] = useState('')
  const [rechargeCustomer, setRechargeCustomer] = useState(null)
  const [error, setError] = useState('')

  const loadSummary = async () => {
    try {
      const data = await api.getWallet()
      setSummary(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load wallet')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    setTxLoading(true)
    try {
      const params = { page, limit: perPage }
      if (isMaster && customerFilter) params.customerId = customerFilter
      const data = await api.getWalletTransactions(params)
      setTransactions(data)
    } catch (err) {
      console.error(err)
    } finally {
      setTxLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [page, perPage, customerFilter, isMaster])

  const customerMap = useMemo(() => {
    const map = new Map()
    for (const c of summary?.customers || []) {
      map.set(c.id, c)
    }
    return map
  }, [summary])

  const filteredTx = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return transactions.transactions
    return transactions.transactions.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(q) ||
        tx.did?.toLowerCase().includes(q) ||
        customerMap.get(tx.customerId)?.name?.toLowerCase().includes(q)
    )
  }, [transactions.transactions, search, customerMap])

  const handleRecharge = async ({ amount, note }) => {
    try {
      await api.rechargeWallet({
        customerId: rechargeCustomer.id,
        amount,
        note,
      })
      setRechargeCustomer(null)
      await loadSummary()
      await loadTransactions()
    } catch (err) {
      setError(err.message || 'Recharge failed')
    }
  }

  const handleSaveRates = async (rates) => {
    try {
      const { callRates } = await api.updateWalletRates(rates)
      setSummary((prev) => (prev ? { ...prev, callRates } : prev))
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to save call rates')
      throw err
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Wallet</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isMaster
            ? 'Recharge customer wallets and review call charges.'
            : 'Your prepaid balance for calls on assigned DIDs.'}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center text-gray-400">Loading…</div>
      ) : isMaster ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-border p-5 ring-1 ring-brand/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total customer balance</p>
              <p className="text-3xl font-bold text-ink mt-2 flex items-center gap-2">
                <HiOutlineCurrencyDollar className="w-8 h-8 text-brand" />
                {formatMoney(summary?.totalCustomerBalance)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-5 ring-1 ring-brand/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customers</p>
              <p className="text-3xl font-bold text-ink mt-2">{summary?.customers?.length || 0}</p>
            </div>
          </div>

          <WalletCallRatesPanel rates={summary?.callRates} editable onSave={handleSaveRates} />

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden ring-1 ring-brand/5">
            <div className="p-5 border-b border-border">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Customer balances</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left border-b border-border">
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Customer
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Email
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Balance
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(summary?.customers || []).length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState message="No customers yet." />
                      </td>
                    </tr>
                  ) : (
                    summary.customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{customer.name}</td>
                        <td className="px-5 py-3.5 text-gray-600">{customer.email}</td>
                        <td className="px-5 py-3.5 font-semibold text-brand">{formatMoney(customer.balance)}</td>
                        <td className="px-5 py-3.5">
                          <PrimaryButton
                            type="button"
                            onClick={() => setRechargeCustomer({ ...customer, walletBalance: customer.balance })}
                            className="!py-1.5 !px-3 !text-xs"
                          >
                            <HiOutlinePlus className="w-3.5 h-3.5" />
                            Recharge
                          </PrimaryButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-border p-8 ring-1 ring-brand/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Available balance</p>
            <p className="text-4xl font-bold text-ink mt-2 flex items-center gap-2">
              <HiOutlineCurrencyDollar className="w-10 h-10 text-brand" />
              {formatMoney(summary?.balance)}
            </p>
          </div>
          <WalletCallRatesPanel rates={summary?.callRates} />
        </>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden ring-1 ring-brand/5">
        <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between border-b border-border">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Transaction history</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            {isMaster && (
              <select
                value={customerFilter}
                onChange={(e) => {
                  setCustomerFilter(e.target.value)
                  setPage(1)
                }}
                className="px-3 py-2 text-sm border border-border rounded-xl bg-white"
              >
                <option value="">All customers</option>
                {(summary?.customers || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <SearchInput
              placeholder="Search transactions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-border">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Date</th>
                {isMaster && (
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>
                )}
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Type</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Balance</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {txLoading ? (
                <tr>
                  <td colSpan={isMaster ? 6 : 5} className="px-5 py-12 text-center text-gray-400">
                    Loading transactions…
                  </td>
                </tr>
              ) : filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={isMaster ? 6 : 5}>
                    <EmptyState message="No wallet transactions yet." />
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
                    {isMaster && (
                      <td className="px-5 py-3.5 text-gray-700">
                        {customerMap.get(tx.customerId)?.name || '—'}
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          tx.type === 'credit'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-3.5 font-semibold ${
                        tx.type === 'credit' ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}
                      {formatMoney(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{formatMoney(tx.balanceAfter)}</td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate" title={tx.description}>
                      {tx.description || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={transactions.totalPages}
          onPageChange={setPage}
          perPage={perPage}
          onPerPageChange={(n) => {
            setPerPage(n)
            setPage(1)
          }}
        />
      </div>

      <RechargeWalletModal
        open={Boolean(rechargeCustomer)}
        onClose={() => setRechargeCustomer(null)}
        onSubmit={handleRecharge}
        customer={rechargeCustomer}
      />
    </div>
  )
}
