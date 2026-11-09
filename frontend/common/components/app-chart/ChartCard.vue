<template>
  <BaseCard class="relative p-6">
    <div class="mb-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        lead="tight"
        class="text-muted-800 dark:text-white"
      >
        <span>{{ $t(title) }}</span>
      </BaseHeading>
    </div>
    <div class="w-full">
      <AddonApexcharts v-bind="chartConfig" />
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'

// Define component props with TypeScript types
interface Props {
  title: string
  chartConfig: ApexOptions
}

// Apply props with default values (if needed in future)
defineProps<Props>()
</script>

<style scoped>
/* Add additional styles if needed */
</style>
