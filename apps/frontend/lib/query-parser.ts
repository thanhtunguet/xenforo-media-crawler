/**
 * Query parser utility for parsing structured search queries
 * Supports queries like:
 * - "originalId = xyz"
 * - "forumId = 3"
 * - "originalId = xyz and forumId = 3"
 * - "title: search term" (for text search)
 * - Simple text search (falls back to title search)
 */

export interface ParsedQuery {
  originalId?: string;
  forumId?: number;
  title?: string;
  isStructured: boolean;
}

/**
 * Parses a search query string into structured filters
 * @param query - The search query string
 * @returns Parsed query object with filters
 */
export function parseQuery(query: string): ParsedQuery {
  if (!query || !query.trim()) {
    return { isStructured: false };
  }

  const trimmed = query.trim();
  const result: ParsedQuery = { isStructured: false };

  // Check if it's a structured query (contains "=" or ":" operators)
  const hasStructuredOperators = /[=:]/.test(trimmed);

  if (hasStructuredOperators) {
    // Parse structured query
    result.isStructured = true;

    // Split by "and" (case insensitive) to handle multiple conditions
    const conditions = trimmed.split(/\s+and\s+/i);

    for (const condition of conditions) {
      const trimmedCondition = condition.trim();

      // Parse "field = value" or "field: value"
      const match = trimmedCondition.match(/^(\w+)\s*[=:]\s*(.+)$/i);
      if (match) {
        const [, field, value] = match;
        const fieldName = field.toLowerCase().trim();
        const fieldValue = value.trim();

        switch (fieldName) {
          case 'originalid':
          case 'original_id':
            result.originalId = fieldValue;
            break;
          case 'forumid':
          case 'forum_id':
            const forumIdNum = parseInt(fieldValue, 10);
            if (!isNaN(forumIdNum)) {
              result.forumId = forumIdNum;
            }
            break;
          case 'title':
            result.title = fieldValue;
            break;
        }
      }
    }
  } else {
    // Simple text search - treat as title search
    result.title = trimmed;
    result.isStructured = false;
  }

  return result;
}

/**
 * Checks if a query string is a structured query
 * @param query - The search query string
 * @returns True if the query contains structured operators
 */
export function isStructuredQuery(query: string): boolean {
  if (!query || !query.trim()) {
    return false;
  }
  return /[=:]/.test(query.trim());
}


