/**
 * Shared internal helpers used across flowchart modules.
 * Not part of the public API.
 */

/**
 * Helper to normalize the 'next' field which can be:
 * - string (task ID) - old format
 * - object { task: string, bind?: Record<string, string> } - new format
 * - null - terminal outcome
 *
 * CATEGORICAL NOTE: The 'next' field represents an edge in polynomial composition
 * (sender → receiver). The bind formulas specify how the sender's outcome payload
 * maps to the receiver's input fields.
 */
export function normalizeNext(next) {
  if (!next) return null;
  if (typeof next === 'string') {
    return { task: next, bind: null };
  }
  return { task: next.task, bind: next.bind || null };
}
