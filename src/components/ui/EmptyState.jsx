import { HiOutlineInbox } from 'react-icons/hi'

export default function EmptyState({ message = 'No data yet.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-brand-light/60 rounded-b-xl">
      <HiOutlineInbox className="w-8 h-8 text-gray-300 mb-3" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}
