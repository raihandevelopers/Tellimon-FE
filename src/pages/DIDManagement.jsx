import { useState } from 'react'
import { HiOutlinePlus } from 'react-icons/hi'
import PrimaryButton from '../components/ui/PrimaryButton'
import EmptyState from '../components/ui/EmptyState'

const mockDIDs = [
  { id: '1', number: '+1 (800) 555-0100', status: 'Active', trunk: 'asterisk-main', calls: 342 },
  { id: '2', number: '+1 (800) 555-0101', status: 'Active', trunk: 'asterisk-main', calls: 128 },
  { id: '3', number: '+1 (800) 555-0102', status: 'Inactive', trunk: 'asterisk-backup', calls: 0 },
]

export default function DIDManagement() {
  const [dids] = useState(mockDIDs)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">DID Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage inbound numbers and Asterisk routing</p>
        </div>
        <PrimaryButton>
          <HiOutlinePlus className="w-4 h-4" />
          Add DID
        </PrimaryButton>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left border-b border-border">
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">DID Number</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Asterisk Trunk</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Calls Today</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dids.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState message="No DIDs configured yet." />
                </td>
              </tr>
            ) : (
              dids.map((did) => (
                <tr key={did.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{did.number}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        did.status === 'Active'
                          ? 'bg-brand-light text-brand-dark border border-brand/20'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {did.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">{did.trunk}</td>
                  <td className="px-5 py-3.5 text-gray-600">{did.calls}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
