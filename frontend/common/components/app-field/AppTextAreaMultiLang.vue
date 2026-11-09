<script setup lang="ts">
import AppTextAreaField from './AppTextAreaField.vue'

const tabs = shallowRef([
  { label: 'عربي', value: 'ar' },
  { label: 'انجليزي', value: 'en' },
  { label: 'كوردى', value: 'kr' },
])
const props = defineProps<{
  label?: string
  placeholder?: string
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  rounded?: 'sm' | 'md' | 'lg' | 'full'
  type?: 'text' | 'textarea'
}>()
</script>
<template>
  <BaseTabs :tabs model-value="ar">
    <template #tab="{ activeValue }">
      <AppTextAreaField
        v-if="activeValue == 'ar'"
        :placeholder="props.placeholder"
        :label="`${props.label} (عربي)`"
        :size="props.size"
        :rounded="props.rounded"
        :type="props.type"
      />
      <AppTextAreaField
        v-else-if="activeValue == 'en'"
        :placeholder="props.placeholder"
        :label="`${props.label} (انجليزي)`"
        :size="props.size"
        :rounded="props.rounded"
        type="text"
      />
      <AppTextAreaField
        v-else-if="activeValue == 'kr'"
        :placeholder="props.placeholder"
        :label="`${props.label} (كوردى)`"
        :size="props.size"
        :rounded="props.rounded"
        type="text"
      />
    </template>
  </BaseTabs>
</template>
