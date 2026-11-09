<script setup lang="ts" generic="TModel">
import type { ErrorObject } from '@vuelidate/core'
import 'flatpickr/dist/flatpickr.css'
import FlatPickr from 'vue-flatpickr-component'

const props = defineProps<{
  label?: string
  placeholder?: string
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  type?: 'text' | 'number' | 'email' | 'password' | 'date' | 'color' | 'time' | 'phoneNumber'
  errors?: ErrorObject[]
  icon?: string
  disabled?: boolean
  className?: string
  min?: number
  max?: number
}>()

const model = defineModel<TModel>()
const showPassword = ref(false)

const inputType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type ?? 'text'
})

const labelText = computed(() => (props.label ? props.label + (props.required ? '*' : '') : ''))

const error = computed(() =>
  props.errors?.length ? props.errors.map((e) => e.$message).join(', ') : ''
)
</script>

<template>
  <div :class="className">
    <!-- Text / Number / Email / Password -->
    <div
      v-if="props.type !== 'date' && props.type !== 'color' && props.type !== 'time'"
      class="relative"
    >
      <BaseInput
        v-model="model as string | number | undefined"
        :size="props.size ?? 'md'"
        :label="labelText"
        :placeholder="props.placeholder"
        :type="inputType"
        rounded="lg"
        contrast="default"
        :error="error"
        :icon="props.icon"
        :disabled="props.disabled"
        :min="props.min"
        :max="props.max"
      />
      <button
        v-if="props.type === 'password'"
        type="button"
        class="absolute end-3 top-10 -translate-y-1/2 text-muted-400 transition-colors hover:text-primary-500"
        :class="props.label ? 'mt-3' : ''"
        @click="showPassword = !showPassword"
      >
        <Icon :name="showPassword ? 'ph:eye-slash' : 'ph:eye'" class="size-5" />
      </button>
    </div>

    <!-- Color Input -->
    <div v-else-if="props.type === 'color'" class="flex flex-col justify-between">
      <div>{{ props.label }}</div>
      <div class="flex gap-2 rounded-3xl bg-white px-3 py-1.5">
        <input v-model="model" type="color" :disabled="props.disabled" class="cursor-pointer" />
        <div>{{ model }}</div>
      </div>
    </div>

    <!-- Date Picker -->
    <div v-else-if="props.type === 'date'" class="flex flex-col justify-between">
      <span v-if="props.label" class="dp__label mb-2">{{ props.label }}</span>
      <FlatPickr
        v-model="model as any"
        :config="{ enableTime: false, dateFormat: 'Y-m-d' }"
        class="w-full rounded-lg px-4 py-2 text-sm"
        :class="error ? 'border-red-500' : 'border border-gray-300'"
        :disabled="props.disabled"
      />
      <span v-if="error" class="mt-1 text-sm text-red-500">{{ error }}</span>
    </div>

    <!-- Time Picker -->
    <div v-else-if="props.type === 'time'" class="flex flex-col justify-between">
      <span v-if="props.label" class="dp__label mb-2">{{ props.label }}</span>
      <FlatPickr
        v-model="model as any"
        :config="{ enableTime: true, noCalendar: true, dateFormat: 'H:i' }"
        class="w-full rounded-lg border px-4 py-2 text-sm"
        :disabled="props.disabled"
      />
      <span v-if="error" class="mt-1 text-sm text-red-500">{{ error }}</span>
    </div>
  </div>
</template>

<style>
.nui-input-wrapper.nui-input-default .nui-input:where([class~='dark'], [class~='dark'] *) {
  background-color: #ffffff0f !important;
}
.dp__input {
  border-radius: 8px !important;
}
</style>
