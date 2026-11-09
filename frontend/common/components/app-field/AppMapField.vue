<script setup lang="ts">
import { LMap, LMarker, LTileLayer } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import { latValidator, lngValidator } from '~/common/services/validation'
import { Validator } from '~/common/services/validator'
import AppInputField from './AppInputField.vue'
const props = defineProps<{
  height?: number
  label?: string
  disableInputField?: boolean
}>()
const lat = defineModel('lat', { default: 33.333 })
const lng = defineModel('lng', { default: 44.444 })
const center = ref({ lat: lat.value, lng: lng.value })
const markerPosition = ref({ lat: lat.value, lng: lng.value })
const locked = ref(false)
const map = ref(null)

const validator = new Validator(
  {
    lat: lat.value,
    lng: lng.value,
  },
  {
    lat: { lat: latValidator('خط الطول') },
    lng: { lat: lngValidator('خط العرض') },
  }
)
const body = validator.validation

const onMapClick = (event) => {
  center.value = {
    lat: event.latlng.lat,
    lng: event.latlng.lng,
  }
  markerPosition.value.lat = event.latlng.lat
  markerPosition.value.lng = event.latlng.lng
  validator.fillBody(markerPosition.value)
}

const onClick = async () => {
  const isValid = await body.value.$validate()

  if (!isValid) return
  center.value = {
    lat: body.value.lat.$model,
    lng: body.value.lng.$model,
  }
  markerPosition.value = {
    lat: body.value.lat.$model,
    lng: body.value.lng.$model,
  }
}
//onMounted(()=>{
//  if(map.value)
//  {
//
//    if(map.value.leafletObject)
//    {
//
//
//      map.value.leafletObject._leaflet_id = 0;
//    }
//    //map.value.leafletObject.off();
//  }
//})
watch(markerPosition, () => {
  lat.value = markerPosition.value.lat
  lng.value = markerPosition.value.lng
})
</script>
<template>
  <ClientOnly>
    <div class="flex flex-col gap-2">
      <div v-if="label" class="mt-2 font-bold">{{ props.label }}</div>

      <div class="w-100% flex items-end justify-center gap-2">
        <div class="w-100%">
          <AppInputField
            v-model="body.lat.$model"
            label="خط الطول"
            :errors="body.lat.$errors"
            :disabled="disableInputField || locked"
          />
        </div>
        <div class="w-100%">
          <AppInputField
            v-model="body.lng.$model"
            label="خط العرض"
            :errors="body.lng.$errors"
            :disabled="disableInputField || locked"
          />
        </div>
        <div class="flex justify-start">
          <BaseButton color="primary" @click="onClick"> تأكيد الموقع </BaseButton>
        </div>
      </div>
      <div class="z-[100] flex flex-col">
        <div
          :style="`height: ${props.height ?? 400}px;`"
          class="rounded-lg"
          :class="locked ? 'locked' : ''"
        >
          <LMap
            ref="map"
            v-model:center="center"
            :use-global-leaflet="false"
            :zoom="8"
            :disabled="locked"
            :draggable="false"
            @click="onMapClick"
          >
            <LTileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              layer-type="base"
              name="OpenStreetMap"
            />
            <LMarker :lat-lng="[markerPosition.lat, markerPosition.lng]" />
          </LMap>
        </div>
      </div>
      <!-- <div class="flex justify-end">
                <BaseButton color="primary"> تأكيد الموقع </BaseButton>
            </div> -->
    </div>
  </ClientOnly>
</template>
<style scoped lang="css">
.locked {
  position: relative;
}
.locked::after {
  content: '';
  border-radius: 22px;
  z-index: 900;
  top: 0;
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
}
button {
  word-break: keep-all;
  white-space: nowrap;
}
</style>
