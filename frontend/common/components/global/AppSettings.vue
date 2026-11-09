<template>
  <button
    type="button"
    class="inline-flex size-9 items-center justify-center rounded-full ring-1 ring-transparent transition-all duration-300 hover:ring-muted-200 hover:ring-offset-4 dark:ring-offset-muted-900 dark:hover:ring-muted-700"
  >
    <NuxtLink to="/settings">
      <span
        class="nui-focus flex size-9 items-center justify-center rounded-full border border-muted-200 bg-white dark:border-muted-700 dark:bg-muted-800"
      >
        <Icon name="ph:gear-light" class="size-5 text-muted-400" />
      </span>
    </NuxtLink>
  </button>
</template>
