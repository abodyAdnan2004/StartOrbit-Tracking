<script lang="ts" setup>
import AppInputField from '~/common/components/app-field/AppInputField.vue'
import {
  alphaNumValidator,
  minLengthValidator,
  mobileValidator,
  requiredValidator,
} from '~/common/services/validation'
import { Validator } from '~/common/services/validator'
import { useAuthStore } from '../store/auth'
import type { RegisterBody } from '../types'

const isLoading = ref(false)
const body = ref<RegisterBody>({
  phoneNumber: '',
  password: '',
  fullName: '',
  // role: 0,
})

const validator = new Validator<RegisterBody>(body.value, {
  phoneNumber: {
    required: requiredValidator('Phone Number'),
    phoneNumber: mobileValidator('Phone Number'),
  },
  fullName: {
    required: requiredValidator('Full Name'),
    phoneNumber: alphaNumValidator('Full Name'),
    minLength: minLengthValidator('Full Name', 2),
  },
  password: {
    required: requiredValidator('Password'),
    minLength: minLengthValidator('Password', 6),
  },
})
const authStore = useAuthStore()
const register = async () => {
  const validate = await validator.validation.value.$validate()
  if (!validate) return
  try {
    isLoading.value = true
    await authStore.register(body.value)
    navigateTo('/')
  } catch (e) {
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AppInputField
    v-model="validator.validation.value.fullName.$model"
    :errors="validator.validation.value.fullName.$errors"
    icon="ph:user-duotone"
    label="Full Name"
  />
  <AppInputField
    v-model="validator.validation.value.phoneNumber.$model"
    :errors="validator.validation.value.phoneNumber.$errors"
    icon="ph:user"
    label="Phone Number"
  />
  <AppInputField
    v-model="validator.validation.value.password.$model"
    :errors="validator.validation.value.password.$errors"
    icon="ph:lock"
    type="password"
    label="Password"
  />
  <BaseButton :loading="isLoading" class="mt-4 w-full" color="primary" @click="register"
    >Register</BaseButton
  >
</template>

<style></style>
