<script setup lang="ts">
import { baseURL } from '~/common/services/app-client/axios'

const props = defineProps<{
  multiple?: boolean
  append?: boolean
  accept?: string
}>()

const model = defineModel<(string | File)[]>()
const imagesSrc = reactive<Map<string, string>>(new Map())

const inputEle = ref()

const open = () => {
  inputEle.value.click()
}
const change = async (e: Event) => {
  const target = e.target as HTMLInputElement

  if (!target.files?.length) return

  if (!props.append) model.value = []

  if (!model.value) model.value = []

  for (let i = 0; i < target.files?.length; i++) {
    const src = await preview(target.files?.item(i) as File)
    imagesSrc.set(target.files.item(i)?.name ?? '', src ?? '')
    model.value?.push(target.files?.item(i) as File)
  }
}

const remove = (index: number) => {
  model.value?.splice(index, 1)
}
const preview = async (file: File) => {
  if (!file) return undefined

  const result_base64 = await new Promise((resolve) => {
    const fileReader = new FileReader()
    fileReader.onload = (_) => resolve(fileReader.result)
    fileReader.readAsDataURL(file)
  })

  return result_base64 as string
}
</script>
<template>
  <div>
    <div
      class="dark:border-#E0E0E024 dark:hover:border-#E0E0E044 dark:focus:border-#E0E0E044 bg-#F9FAFB group cursor-pointer rounded-lg border-[2px] border-dashed border-muted-300 p-3 transition-colors duration-300 hover:border-muted-400"
      tabindex="0"
      role="button"
      @click="open"
    >
      <div class="flex flex-col items-center gap-2 p-1 text-center">
        <div class="flex items-center justify-center rounded-xl bg-primary-500/35 p-2">
          <Icon name="solar-file-download-linear" class="size-6 text-primary-500" />
        </div>
        <label
          for="file"
          class="cursor-pointer text-sm text-muted-400 transition-colors duration-300 group-hover:text-primary-500 group-focus:text-primary-500"
        >
          انفر لرفع الملف
        </label>
      </div>
    </div>
  </div>
  <div v-if="model?.length" class="mt-6 flex items-center gap-3">
    <div
      v-for="(file, i) in model"
      v-if="typeof model !== 'string'"
      class="flex size-24 items-center justify-center rounded-md border-secondary"
      style="position: relative"
    >
      <img
        class="absolute size-full rounded-md"
        :src="imagesSrc.get(file.name)"
        alt="Image preview"
      />
      <div
        class="absolute size-full cursor-pointer rounded-md"
        style="background: rgba(0, 0, 0, 0.8)"
      />
      <Icon name="ph:trash" class="z-10 size-5 cursor-pointer text-red-900" @click="remove(i)" />
    </div>
    <div
      v-else
      class="flex size-24 items-center justify-center rounded-md border-secondary"
      style="position: relative"
    >
      <img class="absolute size-full rounded-md" :src="baseURL + model" alt="Image preview" />
      <div
        class="absolute size-full cursor-pointer rounded-md"
        style="background: rgba(0, 0, 0, 0.8)"
      />
      <Icon name="ph:trash" class="z-10 size-5 cursor-pointer text-red-900" @click="model = []" />
    </div>
  </div>
  <input ref="inputEle" hidden type="file" :accept="accept" :multiple @change="change" />
</template>
