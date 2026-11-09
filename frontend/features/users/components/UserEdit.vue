<script setup lang="ts">
import AppInputField from '~/common/components/app-field/AppInputField.vue'
import AppAutoCompleteField from '~/common/components/app-field/AppAutoCompleteField.vue'
import { requiredValidator, emailValidator, minLengthValidator } from '~/common/services/validation'
import { Validator } from '~/common/services/validator'
import { useUserStore } from '../store'
import { useRoleStore } from '~/features/roles/store'
import type { UserUpdateDto, Role } from '../types'
import type { ApiError } from '~/common/utils/types/ApiResponses'
import { onMounted, watch } from 'vue'

const store = useUserStore()
const roleStore = useRoleStore()

const validator = new Validator<UserUpdateDto>(
  {
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: null,
    roleId: 0,
    isActive: true,
  },
  {
    username: { required: requiredValidator('Username'), minLength: minLengthValidator(3) },
    email: { required: requiredValidator('Email'), email: emailValidator() },
    firstName: { required: requiredValidator('First Name') },
    lastName: { required: requiredValidator('Last Name') },
    roleId: { required: requiredValidator('Role') },
  }
)

const body = validator.validation

const submit = async () => {
  if (!(await body.value.$validate())) return
  try {
    await store.update({ ...validator.extractBody(), id: store.selectedItemId! })
    validator.resetBody()
    store.isEditDialogOpen = false
  } catch (error) {
    const errors = (error as ApiError).response?.data?.errors
    if (errors) validator.setExternalErrors(errors)
  }
}

const resetForm = () => {
  validator.resetBody()
}

onMounted(async () => {
  await roleStore.getAll()
})

watch(
  () => store.isEditDialogOpen,
  async (val) => {
    if (val) {
      resetForm()
      await roleStore.getAll()
      if (store.selectedItem) {
        body.value.username.$model = store.selectedItem.username
        body.value.email.$model = store.selectedItem.email
        body.value.firstName.$model = store.selectedItem.firstName
        body.value.lastName.$model = store.selectedItem.lastName
        body.value.phoneNumber.$model = store.selectedItem.phoneNumber
        body.value.roleId.$model = store.selectedItem.roleId
        body.value.isActive.$model = store.selectedItem.isActive
      }
    }
  }
)
</script>

<template>
  <AppDialog v-model="store.isEditDialogOpen" title="Edit User" size="xl">
    <div class="flex flex-col gap-4 p-3">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AppInputField
          v-model="body.username.$model"
          :errors="body.username.$errors"
          label="Username"
          required
        />
        <AppInputField
          v-model="body.email.$model"
          :errors="body.email.$errors"
          label="Email"
          type="email"
          required
        />
        <AppInputField
          v-model="body.firstName.$model"
          :errors="body.firstName.$errors"
          label="First Name"
          required
        />
        <AppInputField
          v-model="body.lastName.$model"
          :errors="body.lastName.$errors"
          label="Last Name"
          required
        />
        <AppInputField
          v-model="body.phoneNumber.$model"
          :errors="body.phoneNumber.$errors"
          label="Phone Number"
          type="tel"
        />
        <AppAutoCompleteField
          v-model="body.roleId.$model"
          :errors="body.roleId.$errors"
          label="Role"
          :get-url="'/roles'"
          :fetch-on-search="false"
          item-label="name"
          item-value="id"
          search-key="search"
          required
        />
      </div>
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          v-model="body.isActive.$model"
          id="isActiveEdit"
          class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label for="isActiveEdit" class="text-sm font-medium text-gray-700">Active</label>
      </div>
    </div>
    <template #actions>
      <BaseButton color="secondary" variant="outline" @click="store.isEditDialogOpen = false">
        Cancel
      </BaseButton>
      <BaseButton color="primary" :loading="store.isLoading" @click="submit">
        <Icon name="ph:upload-simple-duotone" class="size-5" />
        Save
      </BaseButton>
    </template>
  </AppDialog>
</template>