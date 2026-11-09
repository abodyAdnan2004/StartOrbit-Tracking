<script setup lang="ts">
interface Props {
  cards: number
  items: number
}
const props = defineProps<Props>()
</script>
<template>
  <BaseCard v-for="_ in props.cards" class="space-y-3 p-5" rounded="md">
    <template v-for="_ in props.items">
      <BasePlaceload class="h-4 w-3/5 rounded" />
      <BasePlaceload class="h-4 w-full rounded" />
    </template>
  </BaseCard>
</template>
<style></style>
