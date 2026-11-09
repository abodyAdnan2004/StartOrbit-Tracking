<script setup lang="ts">
import AppAutoCompleteField from '~/common/components/app-field/AppAutoCompleteField.vue'
import AppInputField from '~/common/components/app-field/AppInputField.vue'
import AppTextAreaField from '~/common/components/app-field/AppTextAreaField.vue'
import { capitalLetterValidator, requiredValidator } from '~/common/services/validation'
import { Validator } from '~/common/services/validator'
import type { ApiError } from '~/common/utils/types/ApiResponses'
import { useDepartmentStore } from '../store'
import type { DepartmentUpdateDto } from '../types'

const departmentStore = useDepartmentStore()

const selectedDepartment = computed(() => departmentStore.selectedDepartment)

const validator = new Validator<DepartmentUpdateDto>(
  {
    id: selectedDepartment.value?.id as unknown as number,
    name: selectedDepartment.value?.name as string,
    description: selectedDepartment.value?.description as string,
    code: selectedDepartment.value?.code as string,
    managerId: selectedDepartment.value?.managerId as number | null,
    parentDepartmentId: selectedDepartment.value?.parentDepartmentId as number | null,
    budget: selectedDepartment.value?.budget as number | null,
    location: selectedDepartment.value?.location as string,
    contactEmail: selectedDepartment.value?.contactEmail as string,
    contactPhone: selectedDepartment.value?.contactPhone as string,
  },
  {
    name: {
      required: requiredValidator('اسم القسم'),
    },
    code: {
      required: requiredValidator('رمز القسم'),
      capitalLetter: capitalLetterValidator('رمز القسم'),
    },
  }
)

const body = validator.validation

const isLoading = computed(() => {
  return departmentStore.isLoading
})

const updateDepartment = async () => {
  const isValid = await body.value.$validate()
  if (!isValid) return
  try {
    await departmentStore.updateDepartment(validator.extractBody())
    departmentStore.isEditDialogOpen = false
    validator.resetBody()
  } catch (error) {
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
  () => departmentStore.isEditDialogOpen,
  (value) => {
    if (!value) {
      validator.resetBody()
    } else {
      validator.fillBody({
        id: selectedDepartment.value?.id as unknown as number,
        name: selectedDepartment.value?.name as string,
        description: selectedDepartment.value?.description as string,
        code: selectedDepartment.value?.code as string,
        managerId: selectedDepartment.value?.managerId as number | null,
        parentDepartmentId: selectedDepartment.value?.parentDepartmentId as number | null,
        budget: selectedDepartment.value?.budget as number | null,
        location: selectedDepartment.value?.location as string,
        contactEmail: selectedDepartment.value?.contactEmail as string,
        contactPhone: selectedDepartment.value?.contactPhone as string,
      })
    }
  }
)
</script>

<template>
  <AppDialog
    v-model="departmentStore.isEditDialogOpen"
    title="تعديل القسم"
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
            label="اسم القسم"
            required
          />
          <AppInputField
            v-model="body.code.$model"
            :errors="body.code.$errors"
            size="md"
            label="رمز القسم"
            required
          />
        </div>

        <AppTextAreaField
          v-model="body.description.$model"
          :errors="body.description.$errors"
          size="md"
          label="الوصف"
          rows="3"
        />

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppAutoCompleteField
            v-model="body.managerId.$model"
            fetch-on-search
            search-key="fullName"
            :errors="body.managerId.$errors"
            size="md"
            label="المدير"
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
            label="القسم الأب"
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
            label="الميزانية"
            type="number"
            step="0.01"
            min="0"
          />
          <AppInputField
            v-model="body.location.$model"
            :errors="body.location.$errors"
            size="md"
            label="الموقع"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppInputField
            v-model="body.contactEmail.$model"
            :errors="body.contactEmail.$errors"
            size="md"
            label="البريد الإلكتروني للتواصل"
            type="email"
          />
          <AppInputField
            v-model="body.contactPhone.$model"
            :errors="body.contactPhone.$errors"
            size="md"
            label="هاتف التواصل"
            type="tel"
          />
        </div>
      </div>
    </div>
    <template #actions>
      <BaseButton color="primary" class="gap-1" :loading="isLoading" @click="updateDepartment">
        <Icon name="ph:upload-simple-duotone" class="size-5" />
        حفظ التغييرات
      </BaseButton>
    </template>
  </AppDialog>
</template>
