import * as validations from '@vuelidate/validators'

export type ValidationRuleName =
  | 'requiredValidator'
  | 'emailValidator'
  | 'minLengthValidator'
  | 'maxLengthValidator'
  | 'sameAsValidator'
  | 'numericValidator'
  | 'minValueValidator'
  | 'maxValueValidator'
  | 'integerValidator'
  | 'decimalValidator'
  | 'alphaValidator'
  | 'alphaNumValidator'
  | 'mobileValidator'
  | 'latValidator'
  | 'lngValidator'
  | 'capitalLetterValidator'
export const requiredValidator = (fieldName: string) =>
  validations.helpers.withMessage(`حقل ${fieldName} مطلوب`, validations.required)
export const emailValidator = (fieldName: string) =>
  validations.helpers.withMessage(`حقل ${fieldName} ليس بريد إلكتروني صالح`, validations.email)
export const minLengthValidator = (fieldName: string, minLength: number) =>
  validations.helpers.withMessage(
    `حقل ${fieldName} يجب أن يكون على الأقل ${minLength} حروف`,
    validations.minLength(minLength)
  )
export const maxLengthValidator = (fieldName: string, maxLength: number) =>
  validations.helpers.withMessage(
    `حقل ${fieldName} يجب أن يكون على الأكثر ${maxLength} حروف`,
    validations.maxLength(maxLength)
  )
export const sameAsValidator = (fieldName: string, fieldToMatch: string) =>
  validations.helpers.withMessage(
    `حقل ${fieldName} يجب أن يطابق ${fieldToMatch}`,
    validations.sameAs(fieldToMatch)
  )
export const numericValidator = (fieldName: string) =>
  validations.helpers.withMessage(`حقل ${fieldName} يجب أن يكون رقمًا`, validations.numeric)
export const minValueValidator = (fieldName: string, minValue: number) =>
  validations.helpers.withMessage(
    `حقل ${fieldName} يجب أن يكون على الأقل ${minValue}`,
    validations.minValue(minValue)
  )
export const maxValueValidator = (fieldName: string, maxValue: number) =>
  validations.helpers.withMessage(
    `حقل ${fieldName} يجب أن يكون على الأكثر ${maxValue}`,
    validations.maxValue(maxValue)
  )
export const integerValidator = (fieldName: string) =>
  validations.helpers.withMessage(`حقل ${fieldName} يجب أن يكون عددًا صحيحًا`, validations.integer)
export const decimalValidator = (fieldName: string) =>
  validations.helpers.withMessage(`حقل ${fieldName} يجب أن يكون رقمًا عشريًا`, validations.decimal)
export const alphaValidator = (fieldName: string) =>
  validations.helpers.withMessage(`حقل ${fieldName} يجب أن يحتوي على أحرف فقط`, validations.alpha)
export const alphaNumValidator = (fieldName: string) =>
  validations.helpers.withMessage(
    `حقل ${fieldName} يجب أن يحتوي على أحرف وأرقام فقط`,
    validations.alphaNum
  )
// رقم هاتف عراقي مع +964 أو 00964 أو 077 أو 078 أو 079
export function mobileValidator(fieldName: string) {
  return validations.helpers.withMessage(
    `حقل ${fieldName} يجب أن يكون رقم هاتف صالح`,
    (value: string) => {
      return /^(\+?964|00964|0)(75|77|78|79)\d{8}$/.test(value)
    }
  )
}

export function phoneNumbersValidator(fieldName: string) {
  return validations.helpers.withMessage(
    `${fieldName} يجب أن تكون رقم هاتف صالح`,
    (value: string[]) => {
      return value.every((phone: string) => /^(\+?964|00964|0)(75|77|78|79)\d{8}$/.test(phone))
    }
  )
}

// Latitude Validator: must be between -90 and 90
export const latValidator = (fieldName: string) =>
  validations.helpers.withMessage(`حقل ${fieldName} يجب أن يكون بين -90 و 90`, (value: number) => {
    return value >= -90 && value <= 90
  })

// Longitude Validator: must be between -180 and 180
export const lngValidator = (fieldName: string) =>
  validations.helpers.withMessage(
    `حقل ${fieldName} يجب أن يكون بين -180 و 180`,
    (value: number) => {
      return value >= -180 && value <= 180
    }
  )
export const capitalLetterValidator = (fieldName: string) =>
  validations.helpers.withMessage(
    `حقل ${fieldName} يجب أن يحتوي على احرف كبيرة فقط`,
    (value: string) => {
      if (!value) return true
      const lettersOnly = value.replace(/[^a-zA-Z\u0600-\u06FF]/g, '')
      if (lettersOnly.length === 0) return true
      return !/[a-z]/.test(lettersOnly)
    }
  )

export const passwordComplexityValidator = () => {
  return validations.helpers.withMessage(
    (props) => {
      const value = props.$model
      if (!/[a-z]/.test(value)) return 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل'
      if (!/[A-Z]/.test(value)) return 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل'
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value))
        return 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل'
      return ''
    },
    (value: string) => {
      if (!value) return true
      return /[a-z]/.test(value) && /[A-Z]/.test(value) && /[!@#$%^&*(),.?":{}|<>]/.test(value)
    }
  )
}
