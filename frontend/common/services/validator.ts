import type { Validation, ValidationRuleCollection } from '@vuelidate/core'
import useVuelidate from '@vuelidate/core'
import { helpers } from '@vuelidate/validators'
import { computed, reactive, ref, type Reactive } from 'vue'
import { pascalToCamel } from '~/common/utils'
// No-op validator that always passes - enables $externalResults for fields without other validators
const alwaysValid = helpers.withMessage('', () => true)

export class Validator<T extends object> {
  public formData: Reactive<T>
  public rules: Partial<Record<keyof T, ValidationRuleCollection>>
  public validation: Ref<Validation<T>>
  public externalErrors: Ref<Record<string, string[]>>

  constructor(formData: T, rules: Partial<Record<keyof T, ValidationRuleCollection>> = {}) {
    this.formData = reactive(formData)
    this.rules = rules
    this.externalErrors = ref({})
    this.validation = this.createValidation()
  }

  public createValidation(): Ref<Validation<T>> {
    const defaultRules: Record<keyof T, ValidationRuleCollection> = Object.keys(
      this.formData
    ).reduce(
      (acc, key) => {
        acc[key as keyof T] = (this.rules[key as keyof T] || {
          alwaysValid,
        }) as ValidationRuleCollection

        return acc
      },
      {} as Record<keyof T, ValidationRuleCollection>
    )

    const computedRules = computed(() => defaultRules)

    // Pass externalErrors as the third argument for server-side validation
    const validation = useVuelidate(computedRules.value, this.formData, {
      $externalResults: this.externalErrors,
    }) as Ref<Validation<T>>

    return validation
  }

  // Set external validation errors to display under corresponding fields
  setExternalErrors(errors: Record<string, string[]>): void {
    const mappedErrors: Record<string, string[]> = {}

    for (const [key, messages] of Object.entries(errors)) {
      // Convert PascalCase to camelCase to match form field names
      const camelKey = pascalToCamel(key) as keyof T

      // Only set error if the field exists in the form
      if (camelKey in this.formData) {
        console.log(camelKey, messages)
        mappedErrors[camelKey.toString()] = messages
      }
    }

    this.externalErrors.value = mappedErrors
  }

  // Clear external errors
  clearExternalErrors(): void {
    this.externalErrors.value = {}
  }
  public addRule(key: keyof T, rule: ValidationRuleCollection): void {
    this.rules[key] = rule
    this.validation.value.$reset()
    this.validation.value.$touch()
  }

  extractBody(): T {
    const keys = Object.keys(this.validation.value) as (keyof T)[]
    return keys.reduce((acc, key) => {
      if (this.validation.value[key] && !key.toString().startsWith('$')) {
        acc[key] = this.validation.value[key].$model
      }
      return acc
    }, {} as T)
  }

  async resetBody(): Promise<void> {
    const keys = Object.keys(this.validation.value) as (keyof T)[]
    keys.forEach((key) => {
      if (this.validation.value[key] && !key.toString().startsWith('$')) {
        // if type is array set it to empty array
        if (Array.isArray(this.validation.value[key].$model)) {
          this.validation.value[key].$model = []
        } else {
          this.validation.value[key].$model = null
        }
      }
    })
    await this.validation.value.$reset()
    this.clearExternalErrors()
  }
  fillBody(data: T, customKeys?: { fromKey: string; toKey: string }[]): void {
    const keys = Object.keys(this.validation.value) as (keyof T)[]
    keys.forEach((key) => {
      if (!key.toString().startsWith('$')) {
        if (customKeys) {
          customKeys.forEach((customKey) => {
            if (customKey.fromKey === key.toString()) {
              this.validation.value[customKey.fromKey].$model = data[customKey.toKey as keyof T]
            }
          })
        } else {
          customKeys = []
        }
        if (
          this.validation.value[key] &&
          !customKeys.map((v) => v.fromKey).includes(key.toString())
        ) {
          this.validation.value[key].$model = data[key]
        }
      }
    })
  }
  // add other values on top of the existing ones
  addValues(data: T): void {
    const keys = Object.keys(this.validation.value) as (keyof T)[]
    keys.forEach((key) => {
      if (!key.toString().startsWith('$')) {
        if (this.validation.value[key] && data[key]) {
          this.validation.value[key].$model = data[key]
        }
      }
    })
  }
  resetErrors(): void {
    this.validation.value.$reset()
    this.clearExternalErrors()
  }
}
