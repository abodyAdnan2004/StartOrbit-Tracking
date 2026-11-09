<script lang="ts" setup>
const modelValue = defineModel<File | null>()

const fileInput = ref<HTMLElement | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: { target: { files: File[] } }) => {
  const file = event.target.files[0]
  if (file) {
    modelValue.value = file
  }
}
</script>

<template>
  <div @click="triggerFileInput">
    <slot />
    <input ref="fileInput" type="file" style="display: none" @change="handleFileChange" />
  </div>
</template>
