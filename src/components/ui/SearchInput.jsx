import { HiOutlineSearch } from 'react-icons/hi'

export default function SearchInput({ placeholder, value, onChange, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-shadow"
      />
    </div>
  )
}
