export default function Pagination({ page, totalPages, onPageChange, perPage, onPerPageChange }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-border">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Entries per page</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="border border-border rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer"
        >
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="text-gray-500 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          &lt; Previous
        </button>
        <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-light text-brand font-semibold text-sm">
          {page}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="text-gray-500 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next &gt;
        </button>
      </div>
    </div>
  )
}
