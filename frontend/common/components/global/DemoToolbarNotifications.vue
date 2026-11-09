<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
</script>

<template>
  <div class="group inline-flex items-center justify-center text-start">
    <Menu v-slot="{ close }" as="div" class="relative size-9 text-left">
      <MenuButton as="div">
        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-full ring-1 ring-transparent transition-all duration-300 group-hover:ring-muted-200 group-hover:ring-offset-4 dark:ring-offset-muted-900 dark:group-hover:ring-muted-700"
        >
          <span class="flex size-9 items-center justify-center rounded-full border">
            <Icon name="hugeicons:notification-02" class="size-5 text-primary-500" />
          </span>
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
          class="absolute end-0 mt-2 w-72 origin-top-right divide-y divide-muted-100 rounded-md border border-muted-200 bg-white shadow-lg focus:outline-none dark:divide-muted-700"
        >
          <div class="p-4">
            <div class="relative flex items-center justify-between">
              <h4 class="font-heading text-xs uppercase text-muted-500 dark:text-muted-200">
                الاشعارات
              </h4>
              <NuxtLink
                to="#"
                class="font-alt text-sm font-semibold text-primary-500"
                @click.passive="close"
              >
                عرض الجميع
              </NuxtLink>
            </div>
          </div>
          <div class="p-4">
            <MenuItem v-slot="{ active }" as="div">
              <NuxtLink
                to="#"
                class="group flex w-full items-center rounded-md p-2 text-start text-sm transition-colors duration-300"
                :class="[active ? 'text-primary-500' : 'text-muted-500']"
                @click.passive="close"
              >
                <div class="relative inline-flex size-9 items-center justify-center rounded-full">
                  <img
                    src="/img/avatars/12.svg"
                    class="max-w-full rounded-full object-cover shadow-sm"
                    alt=""
                  />
                </div>
                <div class="ms-2">
                  <h6
                    class="font-heading text-xs font-semibold leading-tight text-muted-800 dark:text-white"
                  >
                    عبدالرحمن خليل
                    <span class="font-normal text-muted-500 dark:text-muted-400"> ترك تعليقا </span>
                  </h6>
                  <p class="text-xs text-muted-400">قبل ساعة واحدة</p>
                </div>
              </NuxtLink>
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>
