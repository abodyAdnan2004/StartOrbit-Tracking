<script setup lang="ts">
import AppInputField from '~/common/components/app-field/AppInputField.vue'
import axiosIns from '~/common/services/app-client/axios'
const userStore = useAppUserStore()
const oldPassword = ref('')
const newPassword = ref('')
const isError = ref(false)
const loading = ref(false)
const changePassword = async () => {
  loading.value = true
  try {
    await axiosIns.put('users/' + userStore.user.id + '/change-password', {
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    })
    oldPassword.value = ''
    newPassword.value = ''
    isError.value = false
    userStore.isChangePasswordDialogOpen = false
  } catch (e) {
    useToast({ message: 'حذث خطا في تغيير كلمة السر', isError: true })
    isError.value = true
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <AppDialog size="md" v-model="userStore.isChangePasswordDialogOpen" title="تغيير الرمز">
    <div class="space-y-3">
      <AppInputField
        v-model="oldPassword"
        size="md"
        type="password"
        label="الرمز القديم"
        :loading
        :error="isError ? 'الرمز القديم خاطء' : ''"
      />
      <AppInputField
        v-model="newPassword"
        size="md"
        type="password"
        :loading
        label="الرمز الجديد"
      />
    </div>
    <template #actions>
      <BaseButton color="primary" @click="changePassword" :loading> تأكيد </BaseButton>
    </template>
  </AppDialog>
</template>
dark:border-[#E0E0E024] dark:hover:border-[#E0E0E044] dark:focus:border-[#E0E0E044] bg-[#0E1224]
group cursor-pointer rounded-lg border-[2px] border-dashed border-muted-300 p-3 transition-colors
duration-300 hover:border-muted-400dark:border-[#E0E0E024] dark:hover:border-[#E0E0E044]
dark:focus:border-[#E0E0E044] bg-[#F9FAFB] group cursor-pointer rounded-lg border-[2px]
border-dashed border-muted-300 p-3 transition-colors duration-300 hover:border-muted-400w-[100%]
flex items-end justify-center gap-2w-[100%]w-[100%]
