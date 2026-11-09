<script setup lang="ts">
const { isOpen } = useCollapse()
</script>

<template>
  <div class="flex h-24 w-full items-center gap-4 transition-all duration-150" v-if="isOpen">
    <DemoAccountMenu />
  </div>
</template>
