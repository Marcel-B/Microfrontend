import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Must match the prefix in components.css and components.json.
const twMerge = extendTailwindMerge({ prefix: 'ui' })

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
