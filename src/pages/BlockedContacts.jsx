import { useState, useEffect, useMemo } from 'react'
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'
import SearchInput from '../components/ui/SearchInput'
import PrimaryButton from '../components/ui/PrimaryButton'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { api } from '../api/client'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BlockedContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const loadContacts = async () => {
    try {
      setContacts(await api.getBlockedContacts())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter((c) => c.number.toLowerCase().includes(q))
  }, [contacts, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => {
    setPage(1)
  }, [search, perPage])

  const handleAdd = async () => {
    const num = newNumber.trim()
    if (!num) return
    try {
      const created = await api.createBlockedContact({ number: num })
      setContacts((prev) => [created, ...prev])
      setNewNumber('')
    } catch (err) {
      if (err.status === 409) setNewNumber('')
    }
  }

  const handleRemove = async (id) => {
    await api.deleteBlockedContact(id)
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <SearchInput
          placeholder="Search blocked contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="lg:max-w-xs flex-1"
        />
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Enter number to block"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-4 py-2.5 text-sm border border-border rounded-xl bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand w-52"
          />
          <PrimaryButton onClick={handleAdd}>
            <HiOutlinePlus className="w-4 h-4" />
            Add Blocked Contact
          </PrimaryButton>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left border-y border-border">
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Blocked Number</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Created</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">
                  Loading blocked contacts…
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState message="No blocked contacts added yet." />
                </td>
              </tr>
            ) : (
              paginated.map((contact) => (
                <tr key={contact.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{contact.number}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{formatDate(contact.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleRemove(contact.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Remove blocked contact"
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
        onPerPageChange={setPerPage}
      />
    </div>
  )
}
