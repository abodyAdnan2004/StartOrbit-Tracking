import pages from './navigation'
export const appName = 'Test Project '
export default defineAppConfig({
  tairo: {
    title: appName,
    collapse: {
      toolbar: {
        enabled: true,
        showTitle: true,
        showNavBurger: true,
        tools: [
          // {
          // 	component: 'DemoThemeToggle',
          // },
          //   {
          //     component: 'DemoToolbarNotifications',
          //   },
          {
            component: 'DemoToolbarAccountMenu',
          },
        ],
      },
      circularMenu: {
        enabled: false,
      },
      navigation: {
        enabled: true,
        header: {
          component: 'AppLogo',
          props: {
            class: 'w-100% text-center',
          },
        },
        // footer: {
        // 	component: 'DemoCollapseNavigationFooter',
        // },
        items: pages as any,
        footer: {
          component: 'NavigationFooter',
          props: {
            class: 'w-100% text-center',
          },
        },
      },
    },
  },
})
