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
  { region: 'Head Office', phone: '+254 716 225 073' },
  { region: 'general', phone: 'help@zumbarl.com' },
  { region: 'fraud', phone: 'fraud@zumbarl.com' },
  { region: 'violence', phone: 'violence@zumbarl.com' },
  { region: 'whistle', phone: 'alarm@zumbarl.com' },
]

export const OFFICES_REGION = 'Head Office'

export const OFFICE_LOCATIONS = [
  {
    name: 'Nairobi, Kenya',
    flag: '🇰🇪',
    tags: [
      { label: 'Business', tone: 'finance' },
      { label: 'Official', tone: 'sales' },
      { label: 'Reports', tone: 'services' },
    ],
    address: ['Ikigai, 4th floor,', 'Westlands, Nairobi'],
    phone: '+254 741 741 381',
  }
]
export const CUMPUS_HUBS = [
  {
    name: 'Kenyata University',
    flag: '',
    tags: [
      { label: 'campus', tone: 'finance' },
      { label: 'hub', tone: 'sales' },
      { label: 'club', tone: 'services' },
    ],
    address: ['Kenyatta University,', 'Nairobi'],
    phone: '+254 722 903 490',
  },{
    name: 'University Of Nairobi',
    flag: '',
    tags: [
      { label: 'campus', tone: 'finance' },
      { label: 'hub', tone: 'sales' },
      { label: 'club', tone: 'services' },
    ],
    address: ['University Of Nairobi,', 'Nairobi'],
    phone: '+254 722 903 490',
  },{
    name: 'Moi University',
    flag: '',
    tags: [
      { label: 'campus', tone: 'finance' },
      { label: 'hub', tone: 'sales' },
      { label: 'club', tone: 'services' },
    ],
    address: ['Moi University,', 'Nairobi'],
    phone: '+254 722 903 490',
  },{
    name: 'Multimedia University of Kenya',
    flag: '',
    tags: [
      { label: 'campus', tone: 'finance' },
      { label: 'hub', tone: 'sales' },
      { label: 'club', tone: 'services' },
    ],
    address: ['Multimedia University of Kenya,', 'Nairobi'],
    phone: '+254 722 903 490',
  },
]
