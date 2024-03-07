//External
import { getCurrentInstance } from 'vue'

export function useVuetify() {
  const instance = getCurrentInstance()
  if (!instance) {
    throw new Error(`useVuetify should be called in setup().`)
  }
  return instance.proxy.$vuetify
}