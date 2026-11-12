<script setup lang="ts">
import AppInputField from '~/common/components/app-field/AppInputField.vue'
import AppAutoCompleteField from '~/common/components/app-field/AppAutoCompleteField.vue'
import { requiredValidator, emailValidator, mobileValidator } from '~/common/services/validation'
import { Validator } from '~/common/services/validator'
import { useCustomerStore } from '../store'
import type { CustomerUpdateDto } from '../types'
import type { ApiError } from '~/common/utils/types/ApiResponses'

const store = useCustomerStore()

const validator = new Validator<CustomerUpdateDto>(
  {
    id: null,
    name: '',
    email: '',
    phone: null,
    address: null,
    notes: null,
    isActive: true,
    userId: null,
  },
  {
    name: { required: requiredValidator('Name') },
    email: { required: requiredValidator('Email'), email: emailValidator('Email') },
    phone: { required: requiredValidator('phone'), email: mobileValidator('phone') },
    address: { required: requiredValidator('address') },
    userId: { required: requiredValidator('userId') },
  }
)

const body = validator.validation

const submit = async () => {
  if (!(await body.value.$validate())) return
  try {
    if (!store.item?.id) return
    await store.update({ ...validator.extractBody(), id: store.item?.id })
    validator.resetBody()
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
      if (store.item) {
        body.value.name.$model = store.item.name
        body.value.email.$model = store.item.email
        body.value.phone.$model = store.item.phone
        body.value.address.$model = store.item.address
        body.value.notes.$model = store.item.notes
        body.value.isActive.$model = store.item.isActive
        body.value.userId.$model = store.item.userId
      }
    }
  }
)
</script>

<template>
  <AppDialog v-model="store.isEditDialogOpen" title="Edit Customer" size="xl">
    <div class="flex flex-col gap-4 p-3">
      <div class="grid grid-cols-2 gap-4 md:grid-cols-2">
        <AppInputField
          v-model="body.name.$model"
          :errors="body.name.$errors"
          label="Name"
          required
        />
        <AppInputField
          v-model="body.email.$model"
          :errors="body.email.$errors"
          label="Email"
          type="email"
        />
        <AppInputField
          v-model="body.phone.$model"
          :errors="body.phone.$errors"
          label="Phone"
          type="phone"
        />
        <AppInputField
          v-model="body.address.$model"
          :errors="body.address.$errors"
          label="Address"
        />
        <AppTextAreaField v-model="body.notes.$model" label="Notes" />
        <AppAutoCompleteField
          v-model="body.userId.$model"
          :errors="body.userId.$errors"
          label="User"
          get-url="/users"
          item-label="name"
          item-value="value"
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
      <BaseButton color="primary" :loading="store.isLoading" @click="submit">
        <Icon name="ph:upload-simple-duotone" class="size-5" />
        Save
      </BaseButton>
    </template>
  </AppDialog>
</template>
