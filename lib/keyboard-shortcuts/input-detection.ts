/**
 * Utility to determine if keyboard shortcuts should be disabled
 * based on current focus state
 */

/**
 * Determines if an input field or text area is currently focused
 * Prevents keyboard shortcuts from firing when user is typing
 *
 * Checks for:
 * - INPUT elements
 * - TEXTAREA elements
 * - Elements with contenteditable attribute
 * - Elements with role="textbox" (ARIA)
 *
 * @returns true if an input is focused, false otherwise
 */
export function isInputFocused(): boolean {
  const activeElement = document.activeElement;

  if (!activeElement) {
    return false;
  }

  const tagName = activeElement.tagName;

  // Check for standard input/textarea elements
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
    return true;
  }

  // Check for contenteditable elements
  if (activeElement.hasAttribute('contenteditable')) {
    const value = activeElement.getAttribute('contenteditable');
    // contenteditable can be "true", "" (empty string), or "plaintext-only"
    if (value === 'true' || value === '' || value === 'plaintext-only') {
      return true;
    }
  }

  // Check for ARIA textbox role
  if (activeElement.getAttribute('role') === 'textbox') {
    return true;
  }

  return false;
}
