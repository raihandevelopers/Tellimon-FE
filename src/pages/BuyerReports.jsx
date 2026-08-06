import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineDocumentDownload, HiOutlinePhone, HiOutlineCheckCircle, HiOutlinePhoneMissedCall } from 'react-icons/hi'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import PrimaryButton from '../components/ui/PrimaryButton'
import InfoBanner from '../components/ui/InfoBanner'
import { api } from '../api/client'
import { monthToDateRange, BUYER_REPORT_STATUS_FILTERS, buyerReportStatusLabel } from '../utils/cdrFilters'
import { downloadBuyerReportsExcel, buyerReportFilename } from '../utils/exportBuyerReports'

const filterInputClass =
  'w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'

function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  )
}

export default function BuyerReports() {
  const [reports, setReports] = useState([])
  const [totalCalls, setTotalCalls] = useState(0)
  const [periodLabel, setPeriodLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const loadReports = async () => {
    setLoading(true)
    try {
      const params = {}
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo
      if (statusFilter) params.status = statusFilter
      const data = await api.getBuyerReports(params)
      setReports(data.reports || [])
      setTotalCalls(data.totalCalls || 0)
      setPeriodLabel(data.period?.label || '')
    } catch (err) {
      console.error(err)
      setReports([])
      setTotalCalls(0)
      setPeriodLabel('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [dateFrom, dateTo, statusFilter])

  const handleMonthChange = (value) => {
    setMonth(value)
    if (!value) {
      setDateFrom('')
      setDateTo('')
      return
    }
    const range = monthToDateRange(value)
    setDateFrom(range.from)
    setDateTo(range.to)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return reports
    return reports.filter(
      (r) => r.name?.toLowerCase().includes(q) || r.number?.toLowerCase().includes(q)
    )
  }, [reports, search])

  const handleExport = () => {
    setExporting(true)
    try {
      downloadBuyerReportsExcel(
        filtered,
        buyerReportFilename({ dateFrom, dateTo, status: statusFilter })
      )
    } finally {
      setExporting(false)
    }
  }

  const clearFilters = () => {
    setMonth('')
    setDateFrom('')
    setDateTo('')
    setStatusFilter('')
    setSearch('')
  }

  const callDetailsLink = (buyer) => {
    const params = new URLSearchParams()
    if (buyer.number) params.set('number', buyer.number)
    if (statusFilter) params.set('status', statusFilter)
    const q = params.toString()
    return `/call-reports${q ? `?${q}` : ''}`
  }

  return (
    <div className="space-y-5">
      <InfoBanner>
        Call counts per buyer from CDR records, using the same business day as the dashboard (8:00 AM IST →
        8:00 AM next day)
        {periodLabel ? ` — current range: ${periodLabel}` : ''}. Filter by date, call status, and export to Excel.
      </InfoBanner>

      <div className="bg-white rounded-2xl border border-border shadow-sm ring-1 ring-brand/5 overflow-hidden">
        <div className="p-5 flex flex-col xl:flex-row xl:items-end gap-4 justify-between border-b border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 flex-1">
            <FilterField label="Month (IST)">
              <input
                type="month"
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
                className={filterInputClass}
              />
            </FilterField>
            <FilterField label="From date">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setMonth('')
                  setDateFrom(e.target.value)
                }}
                className={filterInputClass}
              />
            </FilterField>
            <FilterField label="To date">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setMonth('')
                  setDateTo(e.target.value)
                }}
                className={filterInputClass}
              />
            </FilterField>
            <FilterField label="Call status">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={filterInputClass}
              >
                {BUYER_REPORT_STATUS_FILTERS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Search buyer">
              <SearchInput
                placeholder="Name or number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </FilterField>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 shrink-0 w-full xl:w-auto">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-gray-50 w-full sm:w-auto"
            >
              Clear filters
            </button>
            <PrimaryButton
              type="button"
              onClick={handleExport}
              disabled={exporting || filtered.length === 0}
              className="w-full sm:w-auto"
            >
              <HiOutlineDocumentDownload className="w-4 h-4" />
              {exporting ? 'Exporting…' : 'Export Excel'}
            </PrimaryButton>
          </div>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-b border-border text-sm text-gray-600">
          <span className="font-semibold text-ink">{totalCalls}</span> total calls across{' '}
          <span className="font-semibold text-ink">{filtered.length}</span> buyers
          {dateFrom || dateTo ? (
            <span>
              {' '}
              · {dateFrom || '…'} to {dateTo || '…'} (IST)
            </span>
          ) : (
            <span> · all time</span>
          )}
          {statusFilter ? <span> · {buyerReportStatusLabel(statusFilter)}</span> : null}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading buyer reports…</div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No buyers or no calls match these filters." />
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((buyer) => (
              <div
                key={buyer.buyerId}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm ring-1 ring-brand/5 hover:border-brand/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink truncate">{buyer.name || 'Unnamed buyer'}</h3>
                    <p className="text-sm text-gray-600 mt-0.5 truncate">{buyer.number}</p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      buyer.status === 'Active'
                        ? 'bg-brand-light text-brand-dark'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {buyer.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 border border-border px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 flex items-center gap-1">
                      <HiOutlinePhone className="w-3.5 h-3.5" /> Total
                    </p>
                    <p className="text-2xl font-bold text-ink mt-1">{buyer.totalCalls}</p>
                  </div>
                  <div className="rounded-xl bg-brand-light/50 border border-brand/20 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 flex items-center gap-1">
                      <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Complete
                    </p>
                    <p className="text-2xl font-bold text-brand-dark mt-1">{buyer.answered}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-border px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 flex items-center gap-1">
                      <HiOutlinePhoneMissedCall className="w-3.5 h-3.5" /> Missed
                    </p>
                    <p className="text-2xl font-bold text-ink mt-1">{buyer.missed}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-border px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">Talk time</p>
                    <p className="text-lg font-bold text-ink mt-1">{buyer.talkTimeFormatted || '0:00'}</p>
                  </div>
                </div>

                <Link
                  to={callDetailsLink(buyer)}
                  className="inline-block mt-4 text-xs font-medium text-brand hover:text-brand-dark"
                >
                  View call details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
