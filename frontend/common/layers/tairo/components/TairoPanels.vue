<script setup lang="ts">
const { panels, current, transitionFrom, currentProps, showOverlay, open, close } = usePanels()

watch([current, showOverlay], ([panel, value]) => {
  if (panel?.component && value) {
    document.documentElement.style.overflow = 'hidden'
  } else {
    document.documentElement.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      :enter-from-class="
        transitionFrom === 'left'
          ? '-translate-x-full rtl:translate-x-full'
          : 'translate-x-full rtl:-translate-x-full'
      "
      leave-active-class="transition-transform duration-300 ease-in"
      :leave-to-class="
        transitionFrom === 'left'
          ? '-translate-x-full rtl:translate-x-full'
          : 'translate-x-full rtl:-translate-x-full'
      "
    >
      <slot
        v-bind="{
          panels,
          current,
          transitionFrom,
          currentProps,
          showOverlay,
          open,
          close,
        }"
      >
        <Suspense>
          <component
            :is="resolveComponentOrNative(current.component)"
            v-bind="currentProps"
            v-if="current?.component"
            class="fixed top-0 z-[100] h-full xs:max-w-full"
            :class="[
              current.position === 'left' ? 'start-0' : 'end-0',

              current.size === 'sm' && 'w-96',
              current.size === 'md' && 'w-[460px]',
            ]"
          />
        </Suspense>
      </slot>
    </Transition>

    <div
      role="button"
      tabindex="0"
      class="fixed start-0 top-0 z-[99] size-full cursor-pointer bg-muted-800/60 transition-opacity duration-300"
      :class="
        current && showOverlay ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      "
      @click="close"
    />
  </Teleport>
</template>
