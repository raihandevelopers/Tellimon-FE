import PlaceholderPage from '../components/ui/PlaceholderPage'

export default function ActivityLogs() {
  return (
    <PlaceholderPage
      title="Activity Logs"
      description="Audit trail of all actions in your control room."
      features={['User actions', 'System events', 'Filter by date', 'Export logs']}
    />
  )
}
