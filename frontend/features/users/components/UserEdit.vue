<script setup lang="ts">
import AppInputField from '~/common/components/app-field/AppInputField.vue'
import AppAutoCompleteField from '~/common/components/app-field/AppAutoCompleteField.vue'
import { requiredValidator, emailValidator, minLengthValidator } from '~/common/services/validation'
import { Validator } from '~/common/services/validator'
import { useUserStore } from '../store'
import type { UserUpdateDto } from '../types'
import type { ApiError } from '~/common/utils/types/ApiResponses'

const store = useUserStore()

const validator = new Validator<UserUpdateDto>(
  {
    id: null,
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: null,
    role: null,
    isActive: true,
  },
  {
    username: {
      required: requiredValidator('Username'),
      minLength: minLengthValidator('Username', 3),
    },
    email: { required: requiredValidator('Email'), email: emailValidator('Email') },
    firstName: { required: requiredValidator('First Name') },
    lastName: { required: requiredValidator('Last Name') },
    role: { required: requiredValidator('Role') },
  }
)

const body = validator.validation

const submit = async () => {
  if (!(await body.value.$validate())) return
  try {
    await store.update({ ...validator.extractBody(), id: store.selectedItemId })
    validator.resetBody()
    store.setEditDialog(false)
  } catch (error) {
    const errors = (error as ApiError).response?.data?.errors
    if (errors) validator.setExternalErrors(errors)
  }
}

const resetForm = () => {
  validator.resetBody()
}

watch(
  () => store.isEditDialogOpen,
  async (val) => {
    if (val) {
      resetForm()
      if (store.selectedItem) {
        body.value.username.$model = store.selectedItem.value?.username
        body.value.email.$model = store.selectedItem.value?.email
        body.value.firstName.$model = store.selectedItem.value?.firstName
        body.value.lastName.$model = store.selectedItem.value?.lastName
        body.value.phoneNumber.$model = store.selectedItem.value?.phoneNumber
        body.value.role.$model = store.selectedItem.value?.role
        body.value.isActive.$model = store.selectedItem.value?.isActive
      }
    }
  }
)
</script>

<template>
  <AppDialog v-model="store.isEditDialogOpen" title="Edit User" size="xl">
    <div class="flex flex-col gap-4 p-3">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          type="phoneNumber"
        />
        <AppAutoCompleteField
          v-model="body.role.$model"
          :errors="body.role.$errors"
          label="Role"
          :items="[
            {
              value: 'admin',
              name: 'Admin',
            },
            {
              value: 'user',
              name: 'User',
            },
          ]"
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
          class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label for="isActiveEdit" class="text-sm font-medium text-gray-700">Active</label>
      </div>
    </div>
    <template #actions>
      <BaseButton color="warning" variant="outline" @click="store.setEditDialog(false)">
        Cancel
      </BaseButton>
      <BaseButton color="primary" :loading="store.isLoading.value" @click="submit">
        <Icon name="ph:upload-simple-duotone" class="size-5" />
        Save
      </BaseButton>
    </template>
  </AppDialog>
</template>
