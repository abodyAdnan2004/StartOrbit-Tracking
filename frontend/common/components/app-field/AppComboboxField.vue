<script setup lang="ts">
const props = defineProps<{
  label?: string
  size?: 'sm' | 'md' | 'lg'
  type?: 'text' | 'number' | 'email' | 'password'
}>()
const model = defineModel()
const newChoice = ref('')
const options = ref<string[]>((model.value as any[]) ?? [])

watch(newChoice, (newVal) => {
  if (newVal.includes(',')) {
    newVal = newVal.slice(0, newVal.length - 1)
    newChoice.value = newVal
    if (options.value.includes(newVal)) return
    if (newVal.trim().length >= 4) {
      options.value.push(newVal)
    }
    newChoice.value = ''
  }
})

watch(options.value, (newVal) => {
  model.value = newVal
})
</script>
<template>
  <div class="flex flex-col">
    <span v-if="props.label" class="text-sm text-muted-400">{{ props.label }}</span>
    <div
      class="border-1 bg-accent flex size-full w-full flex-wrap items-center gap-1 rounded-md border border-secondary p-1"
    >
      <template v-for="(option, index) in options">
        <BaseTag size="md" variant="pastel" color="primary">
          {{ option }}
          <Icon name="ph:x" @click="() => options.splice(index, 1)" />
        </BaseTag>
      </template>
      <input
        v-model="newChoice"
        class="h-7 flex-grow border-0 bg-transparent p-2 outline-0"
        type="text"
      />
    </div>
  </div>
</template>
