import {
  required,
  email,
  helpers,
  numeric,
  minLength,
  maxLength,
  sameAs,
  minValue,
  maxValue,
  decimal,
  integer,
} from '@vuelidate/validators'
import type { Composer } from 'vue-i18n'

export type ValidationRule =
  | 'required'
  | 'email'
  | 'minLength'
  | 'maxLength'
  | 'sameAs'
  | 'numeric'
  | 'minValue'
  | 'maxValue'
  | 'integer'
  | 'decimal'
  | 'alpha'
  | 'alphaNum'
  | 'mobile'
  | 'lat'
  | 'lng'

export const createValidator = (
  t: Composer['t'],
  fieldName: string,
  rule: ValidationRule,
  params?: any
) => {
  const getFieldName = () => {
    // If fieldName is empty, return default
    if (!fieldName) {
      return 'field'
    }
    // Always try to get translation first, fallback to fieldName if not found
    const translated = t(fieldName)
    return translated !== fieldName ? translated : fieldName
  }

  const messages = {
    required: () => t('validation.required', { field: getFieldName() }),
    email: () => t('validation.email', { field: getFieldName() }),
    minLength: () => t('validation.minLength', { field: getFieldName(), min: params }),
    maxLength: () => t('validation.maxLength', { field: getFieldName(), max: params }),
    sameAs: () => t('validation.sameAs', { field: getFieldName(), fieldToMatch: params }),
    numeric: () => t('validation.numeric', { field: getFieldName() }),
    minValue: () => t('validation.minValue', { field: getFieldName(), min: params }),
    maxValue: () => t('validation.maxValue', { field: getFieldName(), max: params }),
    integer: () => t('validation.integer', { field: getFieldName() }),
    decimal: () => t('validation.decimal', { field: getFieldName() }),
    alpha: () => t('validation.alpha', { field: getFieldName() }),
    alphaNum: () => t('validation.alphaNum', { field: getFieldName() }),
    mobile: () => t('validation.mobile', { field: getFieldName() }),
    lat: () => t('validation.lat', { field: getFieldName() }),
    lng: () => t('validation.lng', { field: getFieldName() }),
  }

  const validators = {
    required,
    email,
    minLength: minLength(params),
    maxLength: maxLength(params),
    sameAs: sameAs(params),
    numeric,
    minValue: minValue(params),
    maxValue: maxValue(params),
    integer,
    decimal,
    alpha: (value: string) => /^[A-Za-z\u0600-\u06FF\s]+$/.test(value),
    alphaNum: (value: string) => /^[A-Za-z0-9\u0600-\u06FF\s]+$/.test(value),
    mobile: (value: string) => /^[0-9]{10,}$/.test(value),
    lat: (value: string) => {
      const latValue = parseFloat(value)
      return !isNaN(latValue) && latValue >= -90 && latValue <= 90
    },
    lng: (value: string) => {
      const lngValue = parseFloat(value)
      return !isNaN(lngValue) && lngValue >= -180 && lngValue <= 180
    },
  }

  return helpers.withMessage(messages[rule], validators[rule])
}
