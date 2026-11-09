type AppEnumColor =
  | 'default'
  | 'primary'
  | 'dark'
  | 'black'
  | 'default-contrast'
  | 'muted'
  | 'muted-contrast'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'light'

type AppEnumValue = number | string | unknown
interface AppEnum {
  name: string
  arName?: string
  value: AppEnumValue
  color?: AppEnumColor
  icon?: string
}
export type AppEnumGroup = Array<AppEnum>

const UserRoles: AppEnumGroup = [
  {
    arName: 'المستخدم',
    name: 'User',
    value: 0,
  },
  {
    arName: 'التاجر',
    name: 'Merchant',
    value: 1,
  },
  {
    arName: 'المسؤول',
    name: 'Admin',
    value: 2,
  },
]

const getEnumByValue = (enumGroup: AppEnumGroup, value: AppEnumValue) => {
  const appEnum = enumGroup.find((e) => e.value === value)
  return appEnum ?? enumGroup[0]
}

const getEnumByName = (enumGroup: AppEnumGroup, name: string) => {
  const appEnum = enumGroup.find((e) => e.name === name)
  return appEnum ?? enumGroup[0]
}

const getEnumByKey = (
  enumGroup: AppEnumGroup,
  key: keyof (typeof enumGroup)[0],
  value: unknown
) => {
  const appEnum = enumGroup.find((e) => e[key] === value)
  return appEnum ?? enumGroup[0]
}

export { UserRoles, getEnumByKey, getEnumByValue, getEnumByName }
