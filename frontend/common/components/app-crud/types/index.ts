export interface AppCrudProps {
  addText?: string
  totalPages?: number
  hideAdd?: boolean
  addAction?: () => void
  loading?: boolean
  hideTitle?: boolean
  toRefresh?: () => void
}
