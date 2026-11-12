<script setup lang="ts">
import AppInputField from '~/common/components/app-field/AppInputField.vue'
import AppAutoCompleteField from '~/common/components/app-field/AppAutoCompleteField.vue'
import { requiredValidator, emailValidator, mobileValidator } from '~/common/services/validation'
import { Validator } from '~/common/services/validator'
import { useCustomerStore } from '../store'
import type { CustomerCreateDto } from '../types'
import type { ApiError } from '~/common/utils/types/ApiResponses'

const store = useCustomerStore()

const validator = new Validator<CustomerCreateDto>(
  {
    name: '',
    email: '',
    phone: null,
    address: null,
    notes: null,
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
    await store.create(validator.extractBody())
    validator.resetBody()
    store.setCreateDialog(false)
  } catch (error) {
    const errors = (error as ApiError).response?.data?.errors
    if (errors) validator.setExternalErrors(errors)
  }
}

const resetForm = () => {
  validator.resetBody()
}

watch(
  () => store.isCreateDialogOpen,
  (val) => {
    if (val) {
      resetForm()
    }
  }
)
</script>

<template>
  <AppDialog v-model="store.isCreateDialogOpen" title="Create Customer" size="xl">
    <div class="grid grid-cols-1 gap-4">
      <div class="col-span-1 grid grid-cols-2 gap-4">
        <AppInputField v-model="body.name.$model" :errors="body.name.$errors" label="Name" />
        <AppInputField
          v-model="body.email.$model"
          :errors="body.email.$errors"
          label="Email"
          type="email"
        />
      </div>
      <div class="col-span-1 grid grid-cols-2 gap-4">
        <AppInputField
          v-model="body.phone.$model"
          :errors="body.phone.$errors"
          label="Phone"
          type="phoneNumber"
        />
        <AppInputField
          v-model="body.address.$model"
          :errors="body.address.$errors"
          label="Address"
        />
      </div>
      <AppAutoCompleteField
        v-model="body.userId.$model"
        :errors="body.userId.$errors"
        label="User"
        get-url="/users"
        item-label="username"
        item-value="id"
        required
      />
      <AppTextAreaField v-model="body.notes.$model" label="Notes" />
    </div>
    <template #actions>
      <BaseButton
        color="warning"
        variant="outline"
        @click="
          () => {
            resetForm()
          }
        "
      >
        Cancel
      </BaseButton>
      <BaseButton color="primary" :loading="store.isLoading" @click="submit">
        <Icon name="ph:upload-simple-duotone" class="size-5" />
        Create
      </BaseButton>
    </template>
  </AppDialog>
</template>
