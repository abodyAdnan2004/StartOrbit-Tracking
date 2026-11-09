<template>
  <div class="mb-6 flex flex-col justify-between md:flex-row md:items-center">
    <div
      class="flex max-w-[425px] flex-col items-center gap-4 text-center md:flex-row md:text-left lg:max-w-full ltablet:max-w-full"
    >
      <div>
        <BaseHeading as="h2" size="2xl" weight="light" lead="tight" class="dark:text-white">
          <span>{{ $t(title) }}</span>
        </BaseHeading>
        <BaseParagraph>
          <span class="text-muted-500">{{ $t(subTitle) }}</span>
        </BaseParagraph>
      </div>
    </div>
    <div class="mt-4 flex items-center justify-center gap-2 md:mt-0 md:justify-start">
      <BaseButton color="primary">
        <Icon name="i-tabler-plus" class="size-5" />
        <span>{{ $t(buttonText) }}</span>
      </BaseButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  title: string
  subTitle: string
  buttonText: string
}

defineProps<Props>()
</script>
