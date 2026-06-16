import { HiOutlineInbox } from 'react-icons/hi'

export default function EmptyState({ message = 'No data yet.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-brand-light/40 rounded-b-xl">
      <HiOutlineInbox className="w-8 h-8 text-brand/40 mb-3" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}
