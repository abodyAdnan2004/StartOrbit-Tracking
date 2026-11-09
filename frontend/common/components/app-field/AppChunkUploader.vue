<script setup lang="ts">
const props = defineProps<{
  multiple?: boolean
  append?: boolean
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
      class="dark:border-#E0E0E024 dark:hover:border-#E0E0E044 dark:focus:border-#E0E0E044 bg-#0E1224 group cursor-pointer rounded-lg border-[2px] border-dashed border-muted-300 p-3 transition-colors duration-300 hover:border-muted-400"
      tabindex="0"
      role="button"
      @click="open"
    >
      <div class="flex flex-col items-center gap-2 p-1 text-center">
        <div class="flex items-center justify-center rounded-xl bg-primary-500/35 p-2">
          <Icon name="solar-file-download-linear" class="size-6 text-primary-500" />
        </div>
        <h4 class="text-base text-muted-400">اسحب وافلت الفيديو</h4>

        <label
          for="file"
          class="cursor-pointer text-sm text-muted-400 transition-colors duration-300 group-hover:text-primary-500 group-focus:text-primary-500"
        >
          او انفر لرفع الفيديو
        </label>
      </div>
    </div>
  </div>
  <div v-if="model?.length" class="mt-2 flex items-center gap-1">
    <div
      v-for="(file, i) in model"
      class="flex w-full items-center justify-between rounded-2xl rounded-md bg-[#0E1224] p-2"
      style="position: relative"
    >
      <div class="relative flex items-center gap-2">
        <Icon name="solar-video-frame-play-horizontal-line-duotone" class="size-7" />
        <div class="flex flex-col gap-1">
          <span class="text-sm text-muted-400">{{ file.name }}</span>
          <span class="text-sm text-muted-400">{{ file.size / 1024 / 1024 }} MB</span>
        </div>
      </div>
      <Icon
        name="solar-trash-bin-2-bold-duotone"
        class="z-10 size-6 cursor-pointer text-danger-500"
        @click="remove(i)"
      />
    </div>
  </div>
  <input ref="inputEle" hidden type="file" accept="video/*" @change="change" />
</template>
