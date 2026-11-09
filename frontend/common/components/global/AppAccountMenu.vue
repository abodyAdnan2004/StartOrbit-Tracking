<script setup>
import { useAuthStore } from '~/features/auth/store/auth'

const authStore = useAuthStore()
const userData = computed(() => authStore.userData)
const fullName = computed(() => userData.value.fullName || userData.value.username || '')
const role = computed(() => {
  if (userData.value.roles && userData.value.roles.length > 0) {
    return userData.value.roles[0].name
  }
  return ''
})
</script>
<template>
  <div class="mx-2 flex items-center gap-3">
    <BaseAvatar size="sm" class="bg-black text-white" color="dark">
      <Icon name="ph:user" />
    </BaseAvatar>
    <div class="flex flex-col">
      <span class="text-sm font-bold">{{ fullName }}</span>
      <span class="text-xs font-bold text-muted-500">{{ role }}</span>
    </div>
    <div class="flex">
      <BaseDropdown variant="text">
        <BaseDropdownItem
          title="تغيير الرمز السري"
          rounded="sm"
          @click="useAppUserStore().isChangePasswordDialogOpen = true"
        />
        <BaseDropdownItem title="تسجيل خروج" rounded="sm" @click="authStore.logout()" />
      </BaseDropdown>
    </div>
  </div>
  <ChangeUserPassword />
</template>
