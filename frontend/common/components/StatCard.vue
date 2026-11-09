<template>
  <BaseCard class="flex items-center gap-4 p-3">
    <BaseIconBox
      size="md"
      :class="`bg-${color}-100 text-${color}-500 dark:border-2 dark:border-${color}-500 dark:bg-${color}-500/20 dark:text-${color}-400`"
      rounded="full"
      color="none"
    >
      <Icon :name="iconName" class="size-5" />
    </BaseIconBox>
    <div>
      <BaseParagraph size="sm">
        <span class="text-muted-500 dark:text-muted-400">{{ $t(label) }}</span>
      </BaseParagraph>
      <BaseHeading
        as="h2"
        size="md"
        weight="semibold"
        lead="tight"
        class="text-muted-800 dark:text-white"
      >
        <span>{{ value }}</span>
      </BaseHeading>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  iconName?: string
  color?: string
}

withDefaults(defineProps<Props>(), {
  iconName: 'i-mynaui-chart-bar-one-solid',
  color: 'primary',
})
</script>

<style scoped>
/* Add any additional styles here if needed */
</style>
