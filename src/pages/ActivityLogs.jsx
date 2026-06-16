import { useState, useEffect } from 'react'
import {
  HiOutlineLogin,
  HiOutlineUserAdd,
  HiOutlineTrash,
  HiOutlineSpeakerphone,
  HiOutlineBan,
  HiOutlinePhone,
  HiOutlineClipboardList,
} from 'react-icons/hi'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { api } from '../api/client'

const categoryStyles = {
  auth: 'bg-brand-light text-brand-dark border border-brand/20',
  buyer: 'bg-brand/15 text-brand border border-brand/20',
  campaign: 'bg-brand-muted text-ink border border-brand/20',
  blocked: 'bg-ink-soft text-gray-400 border border-border-dark',
  call: 'bg-brand-light text-brand-dark border border-brand/20',
  system: 'bg-ink-soft text-gray-500 border border-border-dark',
}

const actionIcons = {
  login: HiOutlineLogin,
  buyer_created: HiOutlineUserAdd,
  buyer_deleted: HiOutlineTrash,
  campaign_created: HiOutlineSpeakerphone,
  campaign_deleted: HiOutlineTrash,
  contact_blocked: HiOutlineBan,
  contact_unblocked: HiOutlineBan,
  call_completed: HiOutlinePhone,
}

const categories = ['all', 'auth', 'buyer', 'campaign', 'blocked', 'call', 'system']

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatAction(action) {
  return action?.replace(/_/g, ' ') || '—'
}

export default function ActivityLogs() {
  const [data, setData] = useState({ logs: [], total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = { page, limit: perPage }
      if (category !== 'all') params.category = category
      if (search.trim()) params.search = search.trim()
      const res = await api.getActivityLogs(params)
      setData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs()
    }, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [page, perPage, category, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Activity Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Audit trail of actions in your control room
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden ring-1 ring-brand/5">
        <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between border-b border-border">
          <SearchInput
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lg:max-w-xs flex-1"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  category === cat
                    ? 'bg-brand text-white'
                    : 'bg-ink-soft text-gray-400 hover:bg-ink-muted border border-border-dark'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-border">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 w-10" />
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Action</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Description</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">User</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Category</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    Loading activity logs…
                  </td>
                </tr>
              ) : data.logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState message="No activity logged yet. Actions will appear here as you use the panel." />
                  </td>
                </tr>
              ) : (
                data.logs.map((log) => {
                  const Icon = actionIcons[log.action] || HiOutlineClipboardList
                  return (
                    <tr key={log.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="p-2 rounded-lg bg-brand-light text-brand w-fit">
                          <Icon className="w-4 h-4" />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900 capitalize whitespace-nowrap">
                        {formatAction(log.action)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 max-w-md">{log.description}</td>
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">{log.actorName}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            categoryStyles[log.category] || categoryStyles.system
                          }`}
                        >
                          {log.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={data.totalPages || 1}
          onPageChange={setPage}
          perPage={perPage}
          onPerPageChange={(n) => {
            setPerPage(n)
            setPage(1)
          }}
        />
      </div>
    </div>
  )
}
