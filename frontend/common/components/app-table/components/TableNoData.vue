<script setup lang="ts">
const props = defineProps({
  cols: Number,
  title: {
    type: String,
    default: 'no_data',
  },
  subtitle: {
    type: String,
    default: 'add_data_to_display',
  },
})
</script>

<template>
  <TairoTableRow :hoverable="false">
    <TairoTableCell class="!rounded" :colspan="props.cols">
      <BasePlaceholderPage :title="props.title" :subtitle="props.subtitle" />
    </TairoTableCell>
  </TairoTableRow>
</template>
