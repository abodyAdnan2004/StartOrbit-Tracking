export interface FilterField {
  key: string
  label: string
  hide?: () => boolean
  type?: 'text' | 'number' | 'date' | 'select'
  icon?: string
  options?: GeneralOptions & SelectOptions
}

interface GeneralOptions {
  defaultValue?: any
}
interface SelectOptions {
  getUrl?: string
  items?: any
  itemLabel?: string
  itemValue?: string
  fetchOnSearch?: boolean
  searchKey?: string
  defaultParams?: ParamsType
}
export type ParamsType = Record<string, any>
export type GetService = (params: ParamsType) => Promise<void>
