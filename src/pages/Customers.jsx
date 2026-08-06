import { useState, useEffect, useMemo } from 'react'
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineCurrencyDollar } from 'react-icons/hi'
import { formatWalletBalance } from '../utils/formatMoney'
import RechargeWalletModal from '../components/customers/RechargeWalletModal'
import PrimaryButton from '../components/ui/PrimaryButton'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import InfoBanner from '../components/ui/InfoBanner'
import CreateCustomerModal from '../components/customers/CreateCustomerModal'
import { api } from '../api/client'
import { formatDate } from '../utils/formatDate'

function formatDid(number) {
  const d = String(number || '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return number
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [dids, setDids] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [error, setError] = useState('')
  const [rechargeCustomer, setRechargeCustomer] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [customerList, didList] = await Promise.all([api.getCustomers(), api.getDIDs()])
      setCustomers(customerList)
      setDids(didList)
      setError('')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.assignedDids?.some(
          (d) =>
            d.number?.includes(q) ||
            d.displayNumber?.includes(q)
        )
    )
  }, [customers, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleCreate = async (data) => {
    try {
      await api.createCustomer(data)
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err.message || 'Failed to create customer')
    }
  }

  const handleUpdate = async (data) => {
    try {
      await api.updateCustomer(editCustomer.id, data)
      setEditCustomer(null)
      await load()
    } catch (err) {
      setError(err.message || 'Failed to update customer')
    }
  }

  const handleRemove = async (id) => {
    if (!window.confirm('Delete this customer account? Assigned DIDs will be unassigned.')) return
    await api.deleteCustomer(id)
    setCustomers((prev) => prev.filter((c) => c.id !== id))
    load()
  }

  const openEdit = (customer) => {
    setEditCustomer({
      ...customer,
      didAssignments: (customer.assignedDids || []).map((d) => ({
        didId: d.id,
        displayNumber: d.displayNumber || '',
      })),
    })
  }

  const handleRecharge = async ({ amount, note }) => {
    try {
      await api.rechargeWallet({
        customerId: rechargeCustomer.id,
        amount,
        note,
      })
      setRechargeCustomer(null)
      load()
    } catch (err) {
      setError(err.message || 'Recharge failed')
    }
  }

  return (
    <>
      <InfoBanner>
        Master accounts can create customer logins and assign DIDs. Each customer gets their own buyers,
        campaigns, and blocked list — not your master routing data.
      </InfoBanner>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden ring-1 ring-brand/5 mt-4">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between">
          <SearchInput
            placeholder="Search customers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full lg:max-w-xs flex-1"
          />
          <PrimaryButton onClick={() => setModalOpen(true)} className="w-full sm:w-auto shrink-0">
            <HiOutlinePlus className="w-4 h-4" />
            Create Customer
          </PrimaryButton>
        </div>

        {error && (
          <p className="mx-5 mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-y border-border">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Customer</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Email</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">Assigned DIDs</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Wallet</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Created</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    Loading customers…
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState message="No customer accounts yet." />
                  </td>
                </tr>
              ) : (
                paginated.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[10rem] truncate">{customer.name}</td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-[12rem] truncate">{customer.email}</td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-[14rem]">
                      {customer.assignedDids?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {customer.assignedDids.map((d) => (
                            <span
                              key={d.id}
                              className="inline-flex px-2 py-0.5 rounded-md text-xs bg-gray-50 border border-border truncate max-w-full"
                              title={
                                d.displayNumber
                                  ? `${formatDid(d.number)} → ${formatDid(d.displayNumber)}`
                                  : formatDid(d.number)
                              }
                            >
                              {d.displayNumber
                                ? `${formatDid(d.number)} → ${formatDid(d.displayNumber)}`
                                : formatDid(d.number)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-brand whitespace-nowrap">{formatWalletBalance(customer.walletBalance)}</td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(customer.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setRechargeCustomer(customer)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10"
                          aria-label="Recharge wallet"
                          title="Recharge wallet"
                        >
                          <HiOutlineCurrencyDollar className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(customer)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10"
                          aria-label="Edit customer"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(customer.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10"
                          aria-label="Delete customer"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          perPage={perPage}
          onPerPageChange={(n) => {
            setPerPage(n)
            setPage(1)
          }}
        />
      </div>

      <CreateCustomerModal
        key="create-customer"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        dids={dids}
      />

      <CreateCustomerModal
        key={editCustomer?.id || 'edit-customer'}
        open={Boolean(editCustomer)}
        onClose={() => setEditCustomer(null)}
        onSubmit={handleUpdate}
        initial={editCustomer || undefined}
        mode="edit"
        dids={dids}
      />

      <RechargeWalletModal
        open={Boolean(rechargeCustomer)}
        onClose={() => setRechargeCustomer(null)}
        onSubmit={handleRecharge}
        customer={rechargeCustomer}
      />
    </>
  )
}
