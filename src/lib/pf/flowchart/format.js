/**
 * Formatting utilities for flowchart display.
 *
 * CATEGORICAL NOTE: These functions handle the presentation layer for
 * polynomial data (payload types and label templates).
 */

/**
 * Format payload object into a readable string.
 * Used by CardComponent and FlowchartWrapper for consistent display.
 *
 * CATEGORICAL NOTE: Payload represents the direction type B in a monomial A·y^B
 * - specifically, the data that flows along an outcome edge.
 */
export function formatPayload(payload) {
  if (!payload) return null;
  const fields = Object.entries(payload);
  if (fields.length === 0) return null;
  return fields.map(([name, def]) => `${name}: ${def.type || 'any'}`).join(', ');
}

/**
 * Parse a label string containing {fieldName} placeholders and return
 * an array of segments for rendering.
 *
 * CATEGORICAL NOTE: This parses task labels that reference fields from the
 * payload type A. The {fieldName} syntax lets labels display computed values
 * that depend on the task's input parameters.
 *
 * @param label - The label string, e.g., "Exercise daily starting on {startDate}"
 * @param variables - Object mapping field names to their definitions, e.g., { startDate: { type: "date" } }
 * @returns Array of segments: { type: 'text', value: string } or { type: 'variable', name: string, varType: string }
 */
export function parseLabelWithVariables(label, variables = {}) {
  if (!label) return [];

  const segments = [];
  const regex = /\{([^}]+)\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(label)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: label.slice(lastIndex, match.index)
      });
    }

    // Add the variable
    const varName = match[1];
    const varDef = variables[varName];
    segments.push({
      type: 'variable',
      name: varName,
      varType: varDef?.type || 'any'
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after last match
  if (lastIndex < label.length) {
    segments.push({
      type: 'text',
      value: label.slice(lastIndex)
    });
  }

  // If no variables found, return single text segment
  if (segments.length === 0) {
    segments.push({ type: 'text', value: label });
  }

  return segments;
}
