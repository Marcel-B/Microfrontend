import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Must match the prefix in remote.css and components.json.
const twMerge = extendTailwindMerge({ prefix: 'demo' })

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
