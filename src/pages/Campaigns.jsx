import { useState, useEffect } from 'react'
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'
import PrimaryButton from '../components/ui/PrimaryButton'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import CampaignFormModal from '../components/campaigns/CampaignFormModal'
import { api } from '../api/client'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const loadCampaigns = async () => {
    try {
      setCampaigns(await api.getCampaigns())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  const filtered = campaigns.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return c.name.toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleSubmit = async (data) => {
    const created = await api.createCampaign(data)
    setCampaigns((prev) => [created, ...prev])
    setModalOpen(false)
  }

  const handleRemove = async (id) => {
    await api.deleteCampaign(id)
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <SearchInput
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="lg:max-w-xs flex-1"
          />
          <PrimaryButton onClick={() => setModalOpen(true)}>
            <HiOutlinePlus className="w-4 h-4" />
            Create Campaign
          </PrimaryButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-y border-border">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Campaign Name</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Strategy</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Duplicate Handling</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Created</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    Loading campaigns…
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState message="No campaigns created yet." />
                  </td>
                </tr>
              ) : (
                paginated.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{campaign.name}</td>
                    <td className="px-5 py-3.5 text-gray-600">{campaign.strategy}</td>
                    <td className="px-5 py-3.5 text-gray-600">{campaign.duplicateHandling}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {campaign.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(campaign.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleRemove(campaign.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Delete campaign"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
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

      <CampaignFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  )
}
