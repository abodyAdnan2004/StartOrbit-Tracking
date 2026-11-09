<script setup lang="ts">
const props = defineProps<{
  label?: string
  placeholder?: string
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
}>()
const model = defineModel()
</script>
<template>
  <BaseTextarea
    v-model="model"
    :size="props.size ?? 'md'"
    :label="props.label ? props.label + (props.label && props.required ? '*' : '') : ''"
    :placeholder="props.placeholder"
    class="bg-accent border-secondary"
  />
</template>
