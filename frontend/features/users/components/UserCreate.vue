<script setup lang="ts">
import AppInputField from '~/common/components/app-field/AppInputField.vue'
import AppAutoCompleteField from '~/common/components/app-field/AppAutoCompleteField.vue'
import { requiredValidator, emailValidator, minLengthValidator } from '~/common/services/validation'
import { Validator } from '~/common/services/validator'
import { useUserStore } from '../store'
// import { useRoleStore } from '~/features/roles/store'
import type { UserCreateDto } from '../types'
import type { ApiError } from '~/common/utils/types/ApiResponses'
const store = useUserStore()
// // const roleStore = useRoleStore()

const validator = new Validator<UserCreateDto>(
  {
    username: '',
    email: '',
    password: '',
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
    password: {
      required: requiredValidator('Password'),
      minLength: minLengthValidator('Password', 8),
    },
    firstName: { required: requiredValidator('First Name') },
    lastName: { required: requiredValidator('Last Name') },
    role: { required: requiredValidator('Role') },
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

onMounted(async () => {
    //   await roleStore.getAll()
console.log(store.isCreateDialogOpen)
  
})

watch(
  () => store.isCreateDialogOpen,
  (val) => {
    if (val) {
      resetForm()
      //   roleStore.getAll()
    }
  }
)
</script>

<template>
  <AppDialog v-model="store.isCreateDialogOpen" title="Create User" size="xl">
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
          v-model="body.password.$model"
          :errors="body.password.$errors"
          label="Password"
          type="password"
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
          item-label="name"
          item-value="value"
          required
        />
      </div>
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          v-model="body.isActive.$model"
          id="isActive"
          class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label for="isActive" class="text-sm font-medium text-gray-700">Active</label>
      </div>
    </div>
    <template #actions>
      <BaseButton
        color="warning"
        variant="outline"
        @click="
          () => {
            resetForm()
            store.setCreateDialog(false)
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
