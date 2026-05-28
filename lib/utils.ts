import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines Tailwind CSS class names efficiently.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date into a warm, friendly format (e.g. "May 27, 2026").
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Truncates text with an ellipsis for cozy card previews.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}
