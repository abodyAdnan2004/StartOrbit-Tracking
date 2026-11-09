<script setup lang="ts">
import AppAutoCompleteField from '~/common/components/app-field/AppAutoCompleteField.vue'
import AppInputField from '~/common/components/app-field/AppInputField.vue'
import AppTextAreaField from '~/common/components/app-field/AppTextAreaField.vue'
import { capitalLetterValidator, requiredValidator } from '~/common/services/validation'
import { Validator } from '~/common/services/validator'
import type { ApiError } from '~/common/utils/types/ApiResponses'
import { useDepartmentStore } from '../store'
import type { DepartmentCreateDto } from '../types'
import { useToast} from '~/common/composables/toaster'
const departmentStore = useDepartmentStore()

const validator = new Validator<DepartmentCreateDto>(
  {
    name: '',
    description: '',
    code: '',
    managerId: null,
    parentDepartmentId: null,
    budget: null,
    location: '',
    contactEmail: '',
    contactPhone: '',
  },
  {
    name: {
      required: requiredValidator('Department Name'),
    },
    code: {
        required: requiredValidator('Department Code'),
        capitalLetter: capitalLetterValidator('Department Code'),
    },
    parentDepartmentId: {
      required: requiredValidator('Department Name'),
    },
    contactPhone: {
      required: requiredValidator('Contact Phone'),
      mobile: mobileValidator('Contact Phone'),
    },
}
)

const body = validator.validation

const isLoading = computed(() => {
  return departmentStore.isLoading
})

const createDepartment = async () => {
  const isValid = await body.value.$validate()

  if (!isValid) return
  try {
    await departmentStore.createDepartment(validator.extractBody())
    validator.resetBody()
    departmentStore.isCreateDialogOpen = false
  } catch (error) {
    console.error('Error creating department:', error)
    const errors = (error as ApiError).response?.data?.errors
    if (errors) {
      validator.setExternalErrors(errors)
    }
    useToast({
      message: (error as ApiError).response?.data.title,
      isError: true,
    })
  }
}

watch(
  () => departmentStore.isCreateDialogOpen,
  (val: boolean) => {
    if (val) {
      validator.resetBody()
    }
  }
)
</script>

<template>
  <AppDialog
    v-model="departmentStore.isCreateDialogOpen"
    title="Create Department"
    size="xl"
    overflow-y="visible"
  >
    <div class="rounded-3xl p-3">
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppInputField
            v-model="body.name.$model"
            :errors="body.name.$errors"
            size="md"
            label="Department Name"
            required
          />
          <AppInputField
            v-model="body.code.$model"
            :errors="body.code.$errors"
            size="md"
            label="Department Code"
            required
          />
        </div>

        <AppTextAreaField
          v-model="body.description.$model"
          :errors="body.description.$errors"
          size="md"
          label="Description"
          rows="3"
        />

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppAutoCompleteField
            v-model="body.managerId.$model"
            fetch-on-search
            search-key="fullName"
            :errors="body.managerId.$errors"
            size="md"
            label="Manager"
            get-url="/user"
            item-label="fullName"
            item-value="id"
          />
          <AppAutoCompleteField
            v-model="body.parentDepartmentId.$model"
            fetch-on-search
            search-key="name"
            :errors="body.parentDepartmentId.$errors"
            size="md"
            label="Parent Department"
            get-url="/Department"
            item-label="name"
            item-value="id"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppInputField
            v-model="body.budget.$model"
            :errors="body.budget.$errors"
            size="md"
            label="Budget"
            type="number"
            step="0.01"
            :min="0"
          />
          <AppInputField
            v-model="body.location.$model"
            :errors="body.location.$errors"
            size="md"
            label="Location"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppInputField
            v-model="body.contactEmail.$model"
            :errors="body.contactEmail.$errors"
            size="md"
            label="Contact Email"
            type="email"
          />
          <AppInputField
            v-model="body.contactPhone.$model"
            :errors="body.contactPhone.$errors"
            size="md"
            label="Contact Phone"
            type="phoneNumber"
          />
        </div>
      </div>
    </div>
    <template #actions>
      <BaseButton color="primary" class="gap-1" :loading="isLoading" @click="createDepartment">
        <Icon name="ph:upload-simple-duotone" class="size-5" />
        Create New Department
      </BaseButton>
    </template>
  </AppDialog>
</template>
