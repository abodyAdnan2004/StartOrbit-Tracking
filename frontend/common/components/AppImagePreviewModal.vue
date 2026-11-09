<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { FileService } from '~/common/services/app-client/fileService'

const props = defineProps<{
  modelValue: boolean
  imageKey: string
}>()

const emit = defineEmits(['update:modelValue'])

const signedUrl = ref<string>('')
const fileService = new FileService()

const fetchSignedUrl = async () => {
  try {
    if (!props.imageKey) return
    signedUrl.value = await fileService.fetchSignedUrl(props.imageKey)
  } catch {
    // Handle error, e.g., show a notification
  }
}
const modelValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

watch(
  () => props.imageKey,
  () => {
    if (props.imageKey) {
      fetchSignedUrl()
    }
  },
  { immediate: true }
)

const imageUrl = computed(() => signedUrl.value)
const handleRemove = () => {
  emit('remove')
  closeModal()
}

const closeModal = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <AppDialog
    :title="$t('image_preview')"
    size="xl"
    :model-value="modelValue"
    overflow-y="visible"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="modelValue" class="image-preview-modal">
      <div class="modal-overlay" @click="closeModal">
        <div class="modal-content flex flex-col gap-4">
          <img v-if="imageUrl" :src="imageUrl" :alt="imageKey" class="preview-image" />
          <div v-else class="loading">Loading...</div>

          <!-- Delete button moved under image -->
          <BaseButton
            v-if="imageUrl"
            color="danger"
            variant="outline"
            size="sm"
            class="mx-2"
            @click.stop="handleRemove"
          >
            <Icon name="tabler-circle-x" class="me-1 text-danger-500" size="20" />
            <span class="text-nowrap text-xs">{{ $t('delete_image') }}</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </AppDialog>
</template>

<style scoped>
.preview-image {
  max-width: 100%;
  max-height: 70vh; /* Reduced to make space for button */
  user-select: none;
  transition: transform 0.05s ease;
}

.modal-content {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style>
