import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineDocumentDownload,
  HiOutlinePhone,
  HiOutlineCheckCircle,
  HiOutlinePhoneMissedCall,
} from 'react-icons/hi'
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

function normalizeRange(from, to) {
  let dateFrom = from || ''
  let dateTo = to || ''
  if (dateFrom && dateTo && dateFrom > dateTo) {
    ;[dateFrom, dateTo] = [dateTo, dateFrom]
  }
  return { dateFrom, dateTo }
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
  const [applied, setApplied] = useState({ dateFrom: '', dateTo: '', statusFilter: '' })
  const [hideZero, setHideZero] = useState(true)
  const reqId = useRef(0)

  const loadReports = async (filters) => {
    const request = ++reqId.current
    setLoading(true)
    try {
      const { dateFrom: from, dateTo: to } = normalizeRange(filters.dateFrom, filters.dateTo)
      const params = {}
      if (from) params.from = from
      if (to) params.to = to
      if (filters.statusFilter) params.status = filters.statusFilter
      const data = await api.getBuyerReports(params)
      if (request !== reqId.current) return
      setReports(data.reports || [])
      setTotalCalls(data.totalCalls || 0)
      setPeriodLabel(data.period?.label || '')
      setApplied({ dateFrom: from, dateTo: to, statusFilter: filters.statusFilter || '' })
    } catch (err) {
      if (request !== reqId.current) return
      console.error(err)
      setReports([])
      setTotalCalls(0)
      setPeriodLabel('')
    } finally {
      if (request === reqId.current) setLoading(false)
    }
  }

  useEffect(() => {
    loadReports({ dateFrom: '', dateTo: '', statusFilter: '' })
  }, [])

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

  const applyFilters = () => {
    const range = normalizeRange(dateFrom, dateTo)
    setDateFrom(range.dateFrom)
    setDateTo(range.dateTo)
    loadReports({
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      statusFilter,
    })
  }

  const clearFilters = () => {
    setMonth('')
    setDateFrom('')
    setDateTo('')
    setStatusFilter('')
    setSearch('')
    loadReports({ dateFrom: '', dateTo: '', statusFilter: '' })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reports.filter((r) => {
      if (hideZero && (r.totalCalls || 0) === 0) return false
      if (!q) return true
      return r.name?.toLowerCase().includes(q) || r.number?.toLowerCase().includes(q)
    })
  }, [reports, search, hideZero])

  const handleExport = () => {
    setExporting(true)
    try {
      downloadBuyerReportsExcel(
        filtered,
        buyerReportFilename({
          dateFrom: applied.dateFrom,
          dateTo: applied.dateTo,
          status: applied.statusFilter,
        })
      )
    } finally {
      setExporting(false)
    }
  }

  const callDetailsLink = (buyer) => {
    const params = new URLSearchParams()
    if (buyer.number) params.set('number', buyer.number)
    if (applied.statusFilter) params.set('status', applied.statusFilter)
    if (applied.dateFrom) params.set('from', applied.dateFrom)
    if (applied.dateTo) params.set('to', applied.dateTo)
    const q = params.toString()
    return `/call-reports${q ? `?${q}` : ''}`
  }

  const hasDateFilter = Boolean(applied.dateFrom || applied.dateTo)

  return (
    <div className="space-y-5">
      <InfoBanner>
        Buyer totals use the same business day as the dashboard (8:00 AM IST → 8:00 AM next day). Choose month or
        from/to dates, then click Apply.
        {periodLabel ? ` Showing: ${periodLabel}.` : ''}
      </InfoBanner>

      <div className="bg-white rounded-2xl border border-border shadow-sm ring-1 ring-brand/5 overflow-hidden">
        <div className="p-5 flex flex-col xl:flex-row xl:items-end gap-4 justify-between border-b border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 flex-1">
            <FilterField label="Month (IST business days)">
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
              Clear
            </button>
            <PrimaryButton type="button" onClick={applyFilters} className="w-full sm:w-auto">
              Apply filters
            </PrimaryButton>
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

        <div className="px-5 py-3 bg-gray-50 border-b border-border text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
          <div>
            <span className="font-semibold text-ink">{totalCalls}</span> total calls ·{' '}
            <span className="font-semibold text-ink">{filtered.length}</span> buyers shown
            {periodLabel ? <span> · {periodLabel}</span> : null}
            {applied.statusFilter ? <span> · {buyerReportStatusLabel(applied.statusFilter)}</span> : null}
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={hideZero}
              onChange={(e) => setHideZero(e.target.checked)}
              className="rounded border-border"
            />
            Hide buyers with 0 calls
          </label>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading buyer reports…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            message={
              hasDateFilter || applied.statusFilter
                ? 'No buyer calls match these filters. Try another date range.'
                : 'No buyers or calls for the current business day.'
            }
          />
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
