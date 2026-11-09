export const toShortString = (str: string, len: number, extension?: string) => {
  return str.length > len ? str.substring(0, len) + (extension ?? '...') : str
}
export const generateGuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
export const isNullOrEmpty = (str: string | null) => {
  return str == null || str == '' || str == undefined
}
export const pascalToCamel = (str: string): string => {
  return str.charAt(0).toLowerCase() + str.slice(1)
}
