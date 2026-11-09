<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    rounded?: 'none' | 'sm' | 'md' | 'lg'
    scrollable?: boolean
  }>(),
  {
    rounded: 'sm',
    scrollable: true,
  }
)
</script>

<template>
  <div class="flex flex-col">
    <div
      class="border border-muted-200 dark:border-muted-700"
      :class="[
        props.scrollable && 'nui-slimscroll overflow-x-auto',
        props.rounded === 'sm' && 'rounded-md',
        props.rounded === 'md' && 'rounded-lg',
        props.rounded === 'lg' && 'rounded-xl',
      ]"
    >
      <div class="inline-block min-w-full align-middle">
        <div :class="props.scrollable && 'overflow-hidden'">
          <table class="min-w-full table-fixed divide-y divide-muted-200 dark:divide-muted-700">
            <thead>
              <tr>
                <slot name="header" />
              </tr>
            </thead>
            <tbody
              class="divide-y divide-muted-200 bg-white dark:divide-muted-700 dark:bg-muted-800"
            >
              <slot />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
