import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi'
import PrimaryButton from '../components/ui/PrimaryButton'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import InfoBanner from '../components/ui/InfoBanner'
import CreateBuyerModal from '../components/buyers/CreateBuyerModal'
import { api } from '../api/client'
import { formatDate } from '../utils/formatDate'

export default function Buyers() {
  const [buyers, setBuyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editBuyer, setEditBuyer] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [callCounts, setCallCounts] = useState(new Map())

  const loadBuyers = async () => {
    try {
      const [buyerList, reportData] = await Promise.all([api.getBuyers(), api.getBuyerReports()])
      setBuyers(buyerList)
      setCallCounts(new Map((reportData.reports || []).map((r) => [r.buyerId, r.totalCalls])))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBuyers()
  }, [])

  const filtered = buyers.filter((b) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return b.name?.toLowerCase().includes(q) || b.number.toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleCreate = async (data) => {
    const created = await api.createBuyer(data)
    setBuyers((prev) => [created, ...prev])
    setModalOpen(false)
  }

  const handleUpdate = async (data) => {
    const updated = await api.updateBuyer(editBuyer.id, data)
    setBuyers((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    setEditBuyer(null)
  }

  const handleRemove = async (id) => {
    await api.deleteBuyer(id)
    setBuyers((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <>
      <InfoBanner>
        Buyers receive forwarded calls based on <strong>campaign strategy</strong> or DID assignment.{' '}
        <strong>Priority</strong>, <strong>ring timeout</strong>, <strong>daily cap</strong>, and{' '}
        <strong>concurrent limits</strong> are enforced on each inbound call.
      </InfoBanner>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden ring-1 ring-brand/5 mt-4">
        <div className="p-4 sm:p-5 flex flex-col gap-3 sm:gap-4">
          <SearchInput
            placeholder="Search buyers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full lg:max-w-xs"
          />
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:ml-auto">
            <PrimaryButton onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
              <HiOutlinePlus className="w-4 h-4" />
              Create Buyer
            </PrimaryButton>
            <Link
              to="/buyer-reports"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold border border-border rounded-xl hover:bg-gray-50 w-full sm:w-auto"
            >
              Buyer reports
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-y border-border">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">Buyer Name</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">Buyer Number</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">Daily Cap</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Priority</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">Ring Timeout</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Concurrent</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">Total Calls</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Created</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm text-gray-400">
                    Loading buyers…
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState message="No buyers created yet." />
                  </td>
                </tr>
              ) : (
                paginated.map((buyer) => (
                  <tr key={buyer.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[10rem] truncate">{buyer.name || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">{buyer.number}</td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{buyer.dailyCap}</td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{buyer.priority}</td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{buyer.ringTimeout}s</td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{buyer.concurrentCalls}</td>
                    <td className="px-5 py-3.5 font-semibold text-brand whitespace-nowrap">{callCounts.get(buyer.id) ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          buyer.status === 'Active'
                            ? 'bg-brand-light text-brand-dark border border-brand/20'
                            : buyer.status === 'Paused'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {buyer.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(buyer.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditBuyer(buyer)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
                          aria-label="Edit buyer"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(buyer.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
                          aria-label="Delete buyer"
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

      <CreateBuyerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />

      <CreateBuyerModal
        open={!!editBuyer}
        onClose={() => setEditBuyer(null)}
        onSubmit={handleUpdate}
        initial={editBuyer || undefined}
        mode="edit"
      />
    </>
  )
}
