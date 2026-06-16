import { HiOutlinePhone } from 'react-icons/hi'

const liveCalls = [
  { id: '1', caller: '+1 (555) 234-5678', did: '+1 (800) 555-0100', duration: '2:14', agent: 'Trunk A' },
  { id: '2', caller: '+1 (555) 876-5432', did: '+1 (800) 555-0101', duration: '0:45', agent: 'Trunk B' },
  { id: '3', caller: '+1 (555) 111-2222', did: '+1 (800) 555-0100', duration: '5:03', agent: 'Trunk A' },
]

export default function LiveCalls() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Live Calls</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time active calls on your server</p>
        </div>
        <span className="ml-auto flex items-center gap-2 text-sm text-brand font-medium">
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          {liveCalls.length} active
        </span>
      </div>

      <div className="grid gap-4">
        {liveCalls.map((call) => (
          <div
            key={call.id}
            className="bg-white rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4 ring-1 ring-brand/5"
          >
            <div className="p-3 rounded-xl bg-brand-light text-brand">
              <HiOutlinePhone className="w-5 h-5" />
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Caller</p>
                <p className="font-medium text-ink mt-0.5">{call.caller}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">DID</p>
                <p className="font-medium text-ink mt-0.5">{call.did}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Duration</p>
                <p className="font-medium text-ink mt-0.5">{call.duration}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Route</p>
                <p className="font-medium text-ink mt-0.5">{call.agent}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
