export default [
  { name: 'Dashboard', icon: { name: 'ph:house-duotone' }, to: '/', roles: ['admin', 'viewer'] },
  { name: 'Users', icon: { name: 'ph:users-duotone' }, to: '/users', roles: ['admin'] },
  { name: 'Customers', icon: { name: 'ph:user-list-duotone' }, to: '/customers', roles: ['admin', 'viewer'] },
  {
    name: 'Live Tracking',
    icon: { name: 'hugeicons:map-pinpoint-02' },
    to: '/tracking',
    roles: ['admin', 'viewer'],
  },
]
