<script setup lang="ts">
import AppInputField from './AppInputField.vue'
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
  textArea?: boolean
}>()
const arModel = defineModel('ar', { default: '' })
const enModel = defineModel('en', { default: '' })
const krModel = defineModel('kr', { default: '' })
</script>
<template>
  <BaseTabs :tabs model-value="ar">
    <template #tab="{ activeValue }">
      <template v-if="props.textArea">
        <AppTextAreaField
          v-if="activeValue == 'ar'"
          v-model="arModel"
          :placeholder="props.placeholder"
          :label="`${props.label} (عربي)`"
          :size="props.size"
          :rounded="props.rounded"
        />
        <AppTextAreaField
          v-else-if="activeValue == 'en'"
          v-model="enModel"
          :placeholder="props.placeholder"
          :label="`${props.label} (انجليزي)`"
          :size="props.size"
          :rounded="props.rounded"
        />
        <AppTextAreaField
          v-else-if="activeValue == 'kr'"
          v-model="krModel"
          :placeholder="props.placeholder"
          :label="`${props.label} (كوردى)`"
          :size="props.size"
          :rounded="props.rounded"
        />
      </template>
      <template v-else>
        <AppInputField
          v-if="activeValue == 'ar'"
          v-model="arModel"
          :placeholder="props.placeholder"
          :label="`${props.label} (عربي)`"
          :size="props.size"
          type="text"
        />
        <AppInputField
          v-else-if="activeValue == 'en'"
          v-model="enModel"
          :placeholder="props.placeholder"
          :label="`${props.label} (انجليزي)`"
          :size="props.size"
          type="text"
        />
        <AppInputField
          v-else-if="activeValue == 'kr'"
          v-model="krModel"
          :placeholder="props.placeholder"
          :label="`${props.label} (كوردى)`"
          :size="props.size"
          type="text"
        />
      </template>
    </template>
  </BaseTabs>
</template>
