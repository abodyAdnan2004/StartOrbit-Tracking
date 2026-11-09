<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        reverse?: boolean
    }>(),
    {
        reverse: false,
    }
)
</script>

<template>
    <div class="flex min-h-0 flex-1 flex-col justify-stretch">
        <div
            v-if="'top' in $slots || 'bot' in $slots"
            class="grid shrink-0 grid-cols-1 w-full gap-4 sm:flex-row bg-[#FFFFFF] py-2 px-4 rounded-3xl b b-#F0F3F5 my-2"
            :class="props.reverse && 'sm:flex-row-reverse'"
        >
            <div
                v-if="'top' in $slots"
                class="flex w-full items-center gap-4 sm:w-auto"
            >
                <slot name="top" />
            </div>
            <div
                v-if="'bot' in $slots"
                class="flex w-full items-center justify-end gap-4 sm:w-auto"
            >
                <slot name="bot" />
            </div>
        </div>
        <slot />
    </div>
</template>
