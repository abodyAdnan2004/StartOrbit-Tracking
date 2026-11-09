import { useAppCrudStore } from '~/common/components/app-crud/store/AppCrudStore'
import type { FilterField, GetService, ParamsType } from '~/common/utils/types/filters'

export const useFilters = (filterModel?: FilterField[]) => {
  let getService: GetService
  const setGetService = (service: GetService) => (getService = service)
  const router = useRouter()
  const filters = reactive<ParamsType>({ ...useRoute().query })

  filterModel?.forEach((f) => {
    if (!filters[f.key] && f.options?.defaultValue) filters[f.key] = f.options.defaultValue
  })

  const pageNumber = ref(1)
  const isDeleted = ref<boolean>(useRoute().query.isDeleted == 'true')

  const generateQuery = (filters: ParamsType) => {
    const params: Record<string, string | any> = {}

    filterModel?.forEach((f) => {
      if (filters[f.key] == 0 || filters[f.key] == false || filters[f.key]) {
        if (f.type == 'date') {
          if (filters[f.key].toISOString)
            params[f.key] = filters[f.key].toISOString().split('T')[0] ?? ''
        } else params[f.key] = filters[f.key]
      }
    })

    return params
  }

  const getData = () => {
    useAppCrudStore().modelService?.getAll(useRoute().query)
  }
  const clearFilters = () => {
    for (const prop in filters) {
      delete filters[prop]
    }
  }

  watch(
    [filters, isDeleted],
    async () => {
      pageNumber.value = 1
      const query = generateQuery(filters)

      await router.push({
        query: { ...query, isDeleted: isDeleted.value ? 'true' : 'false' },
      })
      getData()
    },
    { deep: true, immediate: true }
  )

  watch(pageNumber, async () => {
    await router.push({
      query: { ...useRoute().query, page: pageNumber.value },
    })
    getData()
  })

  return {
    filters,
    isDeleted,
    setGetService,
    pageNumber,
    getData,
  }
}
