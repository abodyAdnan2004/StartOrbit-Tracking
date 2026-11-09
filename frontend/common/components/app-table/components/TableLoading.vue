<script setup lang="ts">
import AppLoading from '~/common/components/AppLoading.vue'

interface Props {
  rows: number
  columns: number
}
defineProps<Props>()
</script>

<template>
  <TairoTableRow v-for="i in rows" :key="`baseLoad${i}`" :hoverable="false">
    <TairoTableCell v-for="_ in columns">
      <AppLoading :show-avatar="columns === 1" />
    </TairoTableCell>
  </TairoTableRow>
</template>
