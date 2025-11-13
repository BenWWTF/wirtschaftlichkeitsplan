/**
 * Debounce utility to prevent rapid function calls
 * Useful for form submissions, search queries, and API calls
 *
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait before calling function
 * @returns Debounced function
 *
 * @example
 * const saveExpense = debounce(async (expense) => {
 *   await updateExpenseAction(expense)
 * }, 500)
 *
 * // Call rapidly, but function only executes after 500ms of inactivity
 * saveExpense(expense1)
 * saveExpense(expense2) // expense1 is cancelled
 * saveExpense(expense3) // expense2 is cancelled
 * // Only expense3 is saved
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }
}

/**
 * Leading edge debounce - calls immediately then waits
 * Useful when you want instant feedback but prevent rapid repeated calls
 */
export function debounceLeading<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let hasExecuted = false

  return function (...args: Parameters<T>) {
    if (!hasExecuted) {
      func(...args)
      hasExecuted = true

      timeout = setTimeout(() => {
        hasExecuted = false
      }, wait)
    } else if (timeout) {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        hasExecuted = false
      }, wait)
    }
  }
}

/**
 * Throttle utility - limits function calls to once every N milliseconds
 * Different from debounce: executes at regular intervals instead of after inactivity
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastRun = 0

  return function (...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastRun >= wait) {
      func(...args)
      lastRun = now
    }
  }
}
