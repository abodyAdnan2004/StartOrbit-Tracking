<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'
import { useAuthStore } from '~/features/auth/store/auth'
import ChangeLocale from '~/common/components/ChangeLocale.vue'
const authStore = useAuthStore()
const userData = computed(() => authStore.userData)
const fullName = computed(() => userData.value.fullName || userData.value.username || 'Sajad Salam')
const role = computed(() => {
  if (userData.value.roles && userData.value.roles.length > 0) {
    return userData.value.roles[0]?.name
  }
  return 'SuperAdmin'
})
</script>

<template>
  <div class="group relative z-20 inline-flex items-center justify-center text-end">
    <Menu v-slot="{ close }" as="div" class="relative z-20 text-left">
      <MenuButton as="div">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-full transition-all duration-300"
        >
          <div
            class="relative inline-flex size-12 items-center justify-center rounded-full border border-muted-200 p-1"
          >
            <img
              src="/img/avatars/3.svg"
              class="z-40 max-w-full rounded-full object-cover shadow-sm dark:border-transparent"
              alt=""
            />
            <div class="absolute -left-1 z-20 h-4 w-3 bg-white" />
          </div>
          <div
            class="w-45 relative left-1 flex h-20 items-center justify-between rounded-full p-4 text-black"
          >
            <span class="grow text-start">
              <p class="text-[13px] font-bold">
                {{ fullName }}
              </p>
              <p class="text-xs text-muted-500">
                {{ role }}
              </p>
            </span>
            <icon name="tabler-chevron-down" class="size-5 text-gray-500" />
          </div>
        </button>
      </MenuButton>

      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <MenuItems
          class="absolute end-0 mt-2 w-64 origin-top-right divide-y divide-muted-100 rounded-md border border-muted-200 !bg-white shadow-lg focus:outline-none dark:divide-muted-700 dark:border-muted-700 dark:bg-muted-800"
        >
          <div class="p-6 text-center">
            <div class="relative mx-auto flex size-20 items-center justify-center rounded-full">
              <img
                src="/img/avatars/2.svg"
                class="max-w-full rounded-full object-cover shadow-sm dark:border-transparent"
                alt=""
              />
            </div>
            <div class="mt-3">
              <h6 class="lg font-heading font-medium text-muted-800 dark:text-white">
                {{ fullName }}
              </h6>
              <p class="text-xs text-muted-400">
                {{ role }}
              </p>
            </div>
          </div>

          <div class="space-y-2 p-6">
            <BaseButton
              rounded="lg"
              class="group flex w-full items-center rounded-md p-3 text-sm transition-colors duration-300"
              @click="authStore.logout()"
            >
              <Icon name="ic:baseline-log-out" class="size-5" />
              <div class="ms-3">
                <h6
                  class="font-heading text-xs font-medium leading-none text-muted-800 dark:text-white"
                >
                  تسجيل الخروج
                </h6>
              </div>
            </BaseButton>
          </div>

          <ChangeLocale />
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>
