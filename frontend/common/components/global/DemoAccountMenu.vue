<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { useAuthStore } from '~/features/auth/store/auth'

const props = defineProps<{
  horizontal?: boolean
}>()
const authStore = useAuthStore()

const userData = computed(
  () =>
    authStore.userData || {
      name: 'Sajad Salam',
      roles: [
        {
          name: 'SuperAdmin',
          slug: 'super-admin',
        },
      ],
    }
)
const fullName = computed(() => userData.value.fullName || 'Sajad Salam')
const role = computed(
  () => userData.value.roles.map((role) => role.name).join(', ') || 'SuperAdmin'
)
</script>

<template>
  <div class="group inline-flex items-center justify-center rounded-xl text-start">
    <Menu v-slot="{ close }" as="div" class="relative z-20 flex size-10 text-start">
      <MenuButton as="template">
        <button
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-full ring-1 ring-transparent transition-all duration-300 group-hover:ring-primary-500 group-hover:ring-offset-4 dark:ring-offset-muted-800"
        >
          <div class="relative inline-flex size-10 items-center justify-center rounded-full">
            <img
              src="/img/avatars/2.svg"
              class="max-w-full rounded-full object-cover shadow-sm dark:border-transparent"
              alt=""
            />
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
          class="absolute mt-2 w-60 origin-bottom-right rounded-md border border-muted-200 !bg-white bg-white text-left shadow-lg focus:outline-none dark:border-muted-700 dark:bg-muted-800"
          :class="props.horizontal ? 'end-0 top-10' : '-end-64 bottom-0'"
        >
          <div class="rounded-t-xl bg-muted-50 p-6 dark:bg-muted-700/40">
            <div class="flex items-center">
              <div class="relative inline-flex size-14 items-center justify-center rounded-full">
                <img
                  src="/img/avatars/2.svg"
                  class="max-w-full rounded-full object-cover shadow-sm dark:border-transparent"
                  alt=""
                />
              </div>
              <div class="ms-3">
                <h6 class="font-heading text-sm font-medium text-muted-800 dark:text-white">
                  {{ fullName }}
                </h6>
                <p class="text-xs text-muted-400">
                  {{ role }}
                </p>
              </div>
            </div>
          </div>
          <div class="p-2">
            <MenuItem v-slot="{ active }" as="div">
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
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>
