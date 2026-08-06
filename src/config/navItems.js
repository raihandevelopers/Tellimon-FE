import {
  HiOutlineViewGrid,
  HiOutlineSpeakerphone,
  HiOutlineBan,
  HiOutlineUserGroup,
  HiOutlinePhone,
  HiOutlineChartBar,
  HiOutlineStatusOnline,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineChartPie,
} from 'react-icons/hi'

export const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
  { to: '/campaigns', label: 'Campaigns', icon: HiOutlineSpeakerphone },
  { to: '/blocked-contacts', label: 'Blocked Contacts', icon: HiOutlineBan },
  { to: '/buyers', label: 'Buyers', icon: HiOutlineUserGroup },
  { to: '/buyer-reports', label: 'Buyer Reports', icon: HiOutlineChartPie },
  { to: '/customers', label: 'Customers', icon: HiOutlineUsers, masterOnly: true },
  { to: '/assignment-numbers', label: 'Assignment Numbers', icon: HiOutlinePhone, customerOnly: true },
  { to: '/wallet', label: 'Wallet', icon: HiOutlineCurrencyDollar },
  { to: '/did-management', label: 'DID Management', icon: HiOutlinePhone, masterOnly: true },
  { to: '/call-reports', label: 'Call Reports', icon: HiOutlineChartBar },
  { to: '/live-calls', label: 'Live Calls', icon: HiOutlineStatusOnline },
  { to: '/activity-logs', label: 'Activity Logs', icon: HiOutlineClipboardList },
]

export function navItemsForRole(isMaster) {
  return navItems.filter((item) => {
    if (item.masterOnly && !isMaster) return false
    if (item.customerOnly && isMaster) return false
    return true
  })
}
