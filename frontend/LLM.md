# Project Architecture Guide

> A starter-kit reference for building features in this project.  
> Follow these conventions when adding any new screen, CRUD module, or service.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Folder Structure](#folder-structure)
3. [Feature-Based Pattern](#feature-based-pattern)
4. [Adding a CRUD Feature — Step by Step](#adding-a-crud-feature--step-by-step)
5. [Shared Building Blocks](#shared-building-blocks)
6. [Navigation & Routing](#navigation--routing)
7. [Auth & Permissions](#auth--permissions)

---

## Tech Stack

| Concern         | Technology                                             |
| --------------- | ------------------------------------------------------ |
| Framework       | Nuxt 3 — SPA mode (`ssr: false`)                       |
| Language        | TypeScript + Vue 3 `<script setup>`                    |
| State           | Pinia (setup-store style)                              |
| HTTP            | Axios (single shared instance)                         |
| Styling         | UnoCSS + Sass (Tailwind-compatible utilities)          |
| Validation      | Vuelidate via a custom `Validator<T>` wrapper class    |
| i18n            | vue-i18n (`locales/ar.json`, `locales/en.json`)        |
| UI Kit          | Tairo (collapse-sidebar layout, loaded as Nuxt layers) |
| Package Manager | pnpm                                                   |

---

## Folder Structure

```
project-root/
│
├── app.config.ts           # Wires navigation items into the Tairo sidebar layout
├── nuxt.config.ts          # Nuxt config — layers, Pinia dirs, UnoCSS, i18n
├── tailwind.config.ts
├── theme.config.ts
│
├── assets/                 # Global CSS, fonts, and images
├── public/                 # Static assets (logo, avatars)
│
├── middleware/
│   └── auth.global.ts      # Redirects to /login when no token is present
│
├── navigation/
│   └── index.ts            # Sidebar menu items array
│
├── common/                 # ★ All shared/reusable code lives here
│   ├── components/         # Shared UI components (never feature-specific)
│   │   ├── app-chart/      # Chart card wrapper (ApexCharts)
│   │   ├── app-crud/       # CRUD page shell — title, add button, pagination
│   │   │   ├── AppCrud.vue
│   │   │   ├── components/
│   │   │   │   ├── AppCrudActions.vue
│   │   │   │   └── DeleteModal.vue
│   │   │   ├── service/
│   │   │   ├── store/
│   │   │   │   └── AppCrudStore.ts
│   │   │   └── types/
│   │   ├── app-dialog/     # Base modal/dialog wrapper (AppDialog.vue)
│   │   ├── app-field/      # Form field wrappers (input, autocomplete, textarea…)
│   │   │   ├── AppAutoCompleteField.vue
│   │   │   ├── AppComboboxField.vue
│   │   │   ├── AppInputField.vue
│   │   │   ├── AppInputMultiLang.vue
│   │   │   ├── AppTextAreaField.vue
│   │   │   ├── AppFileField.vue
│   │   │   ├── AppFileUploaderButton.vue
│   │   │   ├── AppChunkUploader.vue
│   │   │   ├── AppInputWithFile.vue
│   │   │   └── AppMapField.vue
│   │   ├── app-table/      # Generic data table
│   │   │   ├── AppTable.vue
│   │   │   ├── AppCard.vue
│   │   │   ├── components/
│   │   │   ├── stores/
│   │   │   │   └── AppTableStore.ts
│   │   │   └── types/
│   │   ├── global/         # Layout-level globals (toasts, menus, logo…)
│   │   └── *.vue           # Misc shared components (AppBreadcrumb, StatCard…)
│   │
│   ├── composables/        # Global composables (toaster, filters, apexcharts…)
│   ├── layers/             # Tairo UI kit layers — do not modify
│   │   ├── tairo/
│   │   ├── tairo-layout-collapse/
│   │   └── tairo-layout-iconnav/
│   ├── layouts/
│   │   └── default.vue
│   ├── locales/            # ar.json, en.json
│   ├── plugins/
│   │   └── i18n.ts
│   ├── services/           # Shared HTTP + utility services
│   │   ├── app-client/
│   │   │   ├── axios.ts    # Configured Axios instance with interceptors
│   │   │   ├── fileService.ts
│   │   │   └── index.ts
│   │   ├── toaster/        # Toaster service internals
│   │   ├── validation.ts   # Vuelidate rule factories
│   │   ├── validationWithI18n.ts
│   │   └── validator.ts    # Validator<T> class
│   ├── stores/
│   │   └── user.ts         # Global user store (permissions, profile)
│   ├── styles/
│   │   └── main.scss
│   ├── types/              # Global TypeScript declarations
│   └── utils/
│       ├── constants/
│       │   └── enum.ts
│       ├── index.ts
│       └── types/
│           ├── ApiResponses.ts  # PaginatedResponse<T>, BaseFilters, ApiError…
│           ├── base-dto.ts      # BaseDto (id, deleted, creationDate…)
│           ├── files.ts
│           └── filters.ts
│
└── features/               # ★ Feature modules — one folder per domain
    ├── auth/
    ├── departments/
    ├── home/
    └── …
```

---

## Feature-Based Pattern

Every domain feature lives in `features/<feature-name>/` and follows this internal structure:

```
features/<feature>/
├── index.ts              # Exports tableHeader() — column definitions for AppTable
├── types/
│   └── index.ts          # All TypeScript types for this feature
├── service/
│   └── index.ts          # Service class — all HTTP calls
├── store/
│   └── index.ts          # Pinia store — state, actions, dialog flags
├── components/
│   ├── FeatureCreate.vue  # Create dialog
│   └── FeatureEdit.vue    # Edit dialog
└── routes/
    └── feature.vue        # Route component (thin orchestration layer)
```

The **route component** at `features/<feature>/routes/<feature>.vue` is intentionally thin — it only wires the store to the shared `AppCrud` and `AppTable` components, then mounts the dialogs.

### Layer responsibilities

| Layer         | Rule                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `types/`      | Define all shapes first. Everything else imports from here.                                                              |
| `service/`    | Only HTTP. Never import store here. Never show toasts here (the Axios interceptor handles it).                           |
| `store/`      | Calls service, manages reactive state, owns dialog-open flags. Re-throw errors so dialogs can show field-level messages. |
| `components/` | Only dialogs/forms specific to this feature. Generic UI comes from `common/components/`.                                 |
| `routes/`     | Thin orchestration layer. No business logic.                                                                             |

---

## Adding a CRUD Feature — Step by Step

### Step 1 — Types (`features/<feature>/types/index.ts`)

```typescript
import type { BaseFilters } from '~/common/utils/types/ApiResponses'
import type { BaseDto } from '~/common/utils/types/base-dto'

// Create payload (sent to POST)
export type Feature = {
  name: string
  description?: string | null
}

// What the API returns
export type FeatureDto = BaseDto & {
  id: number
  name: string
  description?: string | null
  createdAt: string
  isActive: boolean
}

export type FeatureCreateDto = Feature

export type FeatureUpdateDto = Feature & { id: number }

// Always extends BaseFilters so pageNumber & pageSize are included
export type FeatureFilters = BaseFilters & {
  name?: string | null
}
```

---

### Step 2 — Service (`features/<feature>/service/index.ts`)

```typescript
import axios from '~/common/services/app-client/axios'
import type { PaginatedResponse } from '~/common/utils/types/ApiResponses'
import type { Feature, FeatureDto, FeatureFilters, FeatureUpdateDto } from '../types'

interface IFeatureService {
  get: (filters: FeatureFilters) => Promise<PaginatedResponse<FeatureDto>>
  getById: (id: number) => Promise<FeatureDto>
  create: (data: Feature) => Promise<FeatureDto>
  update: (id: number, data: FeatureUpdateDto) => Promise<FeatureDto>
  delete: (id: number) => Promise<void>
}

export class FeatureService implements IFeatureService {
  async get(filters: FeatureFilters) {
    const response = await axios.get<PaginatedResponse<FeatureDto>>('/Feature', { params: filters })
    return response.data
  }

  async getById(id: number) {
    const response = await axios.get<FeatureDto>(`/Feature/${id}`)
    return response.data
  }

  async create(data: Feature) {
    const response = await axios.post<FeatureDto>('/Feature', data)
    return response.data
  }

  async update(id: number, data: FeatureUpdateDto) {
    const response = await axios.put<FeatureDto>(`/Feature/${id}`, data)
    return response.data
  }

  async delete(id: number) {
    await axios.delete(`/Feature/${id}`)
  }
}
```

> The Axios interceptor automatically shows success/error toasts on POST/PUT/DELETE. Do not add toast calls inside service methods.

---

### Step 3 — Store (`features/<feature>/store/index.ts`)

```typescript
import { FeatureService } from '../service'
import type { Feature, FeatureDto, FeatureFilters, FeatureUpdateDto } from '../types'

const featureService = new FeatureService()

export const useFeatureStore = defineStore('feature', () => {
  const items = ref<FeatureDto[]>([])
  const isLoading = ref(false)
  const totalPages = ref(0)

  const filters = ref<FeatureFilters>({
    pageSize: 10,
    pageNumber: 1,
    name: null,
  })

  const isCreateDialogOpen = ref(false)
  const isEditDialogOpen = ref(false)
  const selectedItemId = ref<number | null>(null)
  const selectedItem = ref<FeatureDto | null>(null)

  const getAll = async () => {
    try {
      isLoading.value = true
      const response = await featureService.get(filters.value)
      items.value = response.items
      totalPages.value = response.calculatedTotalPages
    } catch (error) {
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  const create = async (data: Feature) => {
    try {
      isLoading.value = true
      await featureService.create(data)
      await getAll()
    } catch (error) {
      console.error(error)
      throw error // re-throw so the form can show field errors
    } finally {
      isLoading.value = false
    }
  }

  const update = async (data: FeatureUpdateDto) => {
    try {
      isLoading.value = true
      await featureService.update(selectedItemId.value!, data)
      await getAll()
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const remove = async (id: number) => {
    try {
      isLoading.value = true
      await featureService.delete(id)
      await getAll()
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const setSelected = (item: FeatureDto) => {
    selectedItem.value = item
    selectedItemId.value = item.id
  }

  return {
    items,
    isLoading,
    filters,
    totalPages,
    isCreateDialogOpen,
    isEditDialogOpen,
    selectedItemId,
    selectedItem,
    getAll,
    create,
    update,
    remove,
    setSelected,
  }
})
```

---

### Step 4 — Table Columns (`features/<feature>/index.ts`)

```typescript
export const tableHeader = () => [
  { key: 'name', label: 'الاسم' },
  { key: 'status', label: 'الحالة' },
  { key: 'actions', label: 'الإجراءات' }, // always last
]
```

Each `key` matches a property on your `Dto`. Use `#data-<key>` slots in the page for custom cell rendering.

---

### Step 5 — Create Dialog (`features/<feature>/components/FeatureCreate.vue`)

```vue
<script setup lang="ts">
import AppInputField from '~/common/components/app-field/AppInputField.vue'
import { requiredValidator } from '~/common/services/validation'
import { Validator } from '~/common/services/validator'
import { useFeatureStore } from '../store'
import type { FeatureCreateDto } from '../types'
import type { ApiError } from '~/common/utils/types/ApiResponses'

const store = useFeatureStore()

const validator = new Validator<FeatureCreateDto>(
  { name: '', description: null },
  { name: { required: requiredValidator('الاسم') } }
)

const body = validator.validation

const submit = async () => {
  if (!(await body.value.$validate())) return
  try {
    await store.create(validator.extractBody())
    validator.resetBody()
    store.isCreateDialogOpen = false
  } catch (error) {
    const errors = (error as ApiError).response?.data?.errors
    if (errors) validator.setExternalErrors(errors)
    useToast({ message: (error as ApiError).response?.data?.title, isError: true })
  }
}

watch(
  () => store.isCreateDialogOpen,
  (val) => {
    if (val) validator.resetBody()
  }
)
</script>

<template>
  <AppDialog v-model="store.isCreateDialogOpen" title="إنشاء" size="xl">
    <div class="flex flex-col gap-4 p-3">
      <AppInputField
        v-model="body.name.$model"
        :errors="body.name.$errors"
        label="الاسم"
        required
      />
    </div>
    <template #actions>
      <BaseButton color="primary" :loading="store.isLoading" @click="submit">
        <Icon name="ph:upload-simple-duotone" class="size-5" />
        حفظ
      </BaseButton>
    </template>
  </AppDialog>
</template>
```

---

### Step 6 — Edit Dialog (`features/<feature>/components/FeatureEdit.vue`)

Same as Create with two differences:

1. Watch `store.isEditDialogOpen` and pre-fill the form from `store.selectedItem`.
2. Call `store.update()` instead of `store.create()`.

```typescript
watch(
  () => store.isEditDialogOpen,
  (val) => {
    if (val && store.selectedItem) {
      body.value.name.$model = store.selectedItem.name
      // populate other fields...
    }
  }
)

const submit = async () => {
  if (!(await body.value.$validate())) return
  try {
    await store.update({ ...validator.extractBody(), id: store.selectedItemId! })
    store.isEditDialogOpen = false
  } catch (error) {
    const errors = (error as ApiError).response?.data?.errors
    if (errors) validator.setExternalErrors(errors)
  }
}
```

---

### Step 7 — Route Component (`features/<feature>/routes/<feature>.vue`)

```vue
<script setup lang="ts">
import AppCrudActions from '~/common/components/app-crud/components/AppCrudActions.vue'
import AppTable from '~/common/components/app-table/AppTable.vue'
import { useAppTableStore } from '~/common/components/app-table/stores/AppTableStore'
import { tableHeader } from '~/features/feature'
import FeatureCreate from '~/features/feature/components/FeatureCreate.vue'
import FeatureEdit from '~/features/feature/components/FeatureEdit.vue'
import { useFeatureStore } from '~/features/feature/store'
import type { FeatureFilters } from '~/features/feature/types'

definePageMeta({ title: 'عنوان الصفحة' })

const store = useFeatureStore()
const appTableStore = useAppTableStore()

const items = computed(() => store.items || [])
const isLoading = computed(() => store.isLoading)

// Two-way writable computed so filters update the store and trigger the watcher
const filters = computed<FeatureFilters>({
  get: () => store.filters,
  set: (value) => {
    store.filters = value
  },
})

const fetchAll = async () => {
  appTableStore.setLoading(true)
  await store.getAll()
  appTableStore.setLoading(false)
}

fetchAll()

watch(filters, () => fetchAll(), { deep: true })

// Reset filters when leaving the page
onUnmounted(() => {
  store.filters = { pageSize: 10, pageNumber: 1, name: null }
})
</script>

<template>
  <div>
    <AppCrud
      title="عنوان القسم"
      add-button-text="إضافة جديد"
      :add-btn-action="() => (store.isCreateDialogOpen = true)"
      :pagination="true"
      :total-pages="store.totalPages"
      @update:current-page="filters.pageNumber = $event"
    >
      <template #filters>
        <BaseInput v-model="filters.name" placeholder="البحث" />
      </template>

      <AppTable title="عنوان القسم" :headers="tableHeader()" :items="items" :is-loading="isLoading">
        <!-- Custom cell — key matches tableHeader key -->
        <template #data-name="{ item }">
          <span class="font-medium">{{ item.name }}</span>
        </template>

        <template #data-actions="{ item }">
          <AppCrudActions
            :item="item"
            :edit-button-action="
              () => {
                store.setSelected(item)
                store.isEditDialogOpen = true
              }
            "
            :delete-service="store.remove"
          />
        </template>
      </AppTable>
    </AppCrud>

    <FeatureCreate />
    <FeatureEdit />
  </div>
</template>
```

---

### Step 8 — Add to Navigation (`navigation/index.ts`)

```typescript
{
  name: 'اسم القسم',
  icon: { name: 'ph-<icon>-duotone', class: 'w-5 h-5' },
  to: '/feature',
  permission: 'Feature.getAll', // omit if no permission check needed
}
```

Icons use the **Phosphor Icons** set → [phosphoricons.com](https://phosphoricons.com)

For a grouped dropdown in the sidebar use `children: [...]` instead of `to`.

---

## Shared Building Blocks

### `AppCrud` props & slots

| Prop / Slot                    | Purpose                             |
| ------------------------------ | ----------------------------------- |
| `title`                        | Page heading                        |
| `add-button-text`              | Label for the add button            |
| `:add-btn-action`              | Callback when add button is clicked |
| `:pagination` + `:total-pages` | Enables bottom pagination           |
| `@update:current-page`         | Emitted when page changes           |
| `#filters` slot                | Search inputs and filter dropdowns  |

### `AppTable` props & slots

| Prop / Slot     | Purpose                                        |
| --------------- | ---------------------------------------------- |
| `:headers`      | Array of `{ key, label }` from `tableHeader()` |
| `:items`        | Array of data rows                             |
| `:is-loading`   | Shows skeleton loader                          |
| `#data-<key>`   | Override rendering for a specific column cell  |
| `#data-actions` | Place `AppCrudActions` here                    |

### `AppCrudActions` props

| Prop                  | Purpose                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| `:edit-button-action` | Callback to open the edit dialog for this row                              |
| `:delete-service`     | Async `(id) => void` — handles the delete confirmation modal automatically |

### `AppAutoCompleteField` props

| Prop               | Purpose                                                      |
| ------------------ | ------------------------------------------------------------ |
| `:get-url`         | API path to fetch options (e.g. `'/Department'`)             |
| `:item-label`      | Property to display in the dropdown                          |
| `:item-value`      | Property to use as the bound value                           |
| `:search-key`      | Query param name sent when the user types                    |
| `:fetch-on-search` | Only fetch when user types (avoids loading all data upfront) |

### `Validator<T>` usage

```typescript
const validator = new Validator<MyDto>(
  { field: '' }, // initial values
  { field: { required: requiredValidator('Field') } } // Vuelidate rules
)

const body = validator.validation // reactive — bind to template
await body.value.$validate() // returns true/false
validator.extractBody() // plain data object (no $ keys)
validator.resetBody() // clears all fields to initial values
validator.setExternalErrors(errors) // maps server validation errors to fields
```

### Axios client behaviour

- Attaches `Authorization: Bearer <token>` and `Accept-Language` on every request automatically.
- **Success toasts** shown automatically on POST / PUT / DELETE — do not add them manually in services.
- **Error toasts** shown automatically; redirects to `/login` on 401.
- `null` / `undefined` filter params are stripped automatically — pass the raw filters object as-is.

---

## Navigation & Routing

- Routes live in `features/<feature>/routes/` — each `.vue` file becomes a route automatically.
- Dynamic routes use brackets: `features/feature/routes/[id].vue` → `/feature/:id`.
- The sidebar reads from `navigation/index.ts` and is configured in `app.config.ts`.
- Links with a `permission` field are hidden from users who do not have that permission.

---

## Auth & Permissions

- Token stored in `localStorage.token` by `useAuthStore` (`features/auth/store/auth.ts`).
- All routes are protected by `middleware/auth.global.ts` — no per-page setup needed.
- Check permissions in components: `useUserStore().hasPermission('Feature.action')`.
- `useUserStore` lives in `common/stores/user.ts` and holds the user profile and permission list.
