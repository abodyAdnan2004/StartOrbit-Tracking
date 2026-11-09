<script setup lang="ts">
import { useAuthStore } from '~/features/auth/store/auth'

const authStore = useAuthStore()
const userData = computed(
  () =>
    authStore.userData || {
      employee_name: {
        ar: 'Sajad Salam',
        en: 'Sajad Salam',
      },
      organizational_structure: {
        name: {
          ar: 'SuperAdmin',
          en: 'SuperAdmin',
        },
      },
    }
)
const fullName = computed(() => userData.value.employee_name.ar || 'Sajad Salam')
const role = computed(() => userData.value.organizational_structure.name.ar || 'SuperAdmin')
</script>
<template>
  <div>
    <div class="font-medium">
      {{ fullName }}
    </div>
    <div class="text-sm font-light">
      {{ role }}
    </div>
  </div>
</template>
