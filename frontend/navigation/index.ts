export default [
  { name: 'Dashboard', icon: 'ph:house-duotone', to: '/', roles: ['admin', 'viewer'] },
  { name: 'Users', icon: 'ph:users-duotone', to: '/users', roles: ['admin'] },
  { name: 'Customers', icon: 'ph:user-list-duotone', to: '/customers', roles: ['admin', 'viewer'] },
  {
    name: 'Live Tracking',
    icon: 'hugeicons:map-pinpoint-02',
    to: '/tracking',
    roles: ['admin', 'viewer'],
  },
]
