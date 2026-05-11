import {
  HiOutlineArrowUpRight,
  HiOutlineBugAnt,
  HiOutlineCalendarDays,
  HiOutlineUserGroup,
} from 'react-icons/hi2'

export const CONTACT_ACTIONS = [
  { label: 'Meet an advisor', href: 'appointment.html', Icon: HiOutlineCalendarDays },
  { label: 'Request developments', href: 'page/developers-on-demand.html', Icon: HiOutlineArrowUpRight },
  { label: 'Become a partner', href: 'become-a-partner.html', Icon: HiOutlineUserGroup },
  {
    label: 'Report a bug',
    href: 'https://github.com/zumbarl/zumbarl/issues',
    Icon: HiOutlineBugAnt,
    external: true,
  },
]

export const EMERGENCY_LINES = [
  { region: 'Kenya', phone: '+254 716 225 073' },
  { region: 'East Africa', phone: '+254 700 123 456' },
  { region: 'Europe', phone: '+32 2 616 80 02' },
  { region: 'Middle East', phone: '+971 4 498 7800' },
  { region: 'Asia', phone: '+91 79 40 500 100' },
]
