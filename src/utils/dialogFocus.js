/** Release focus before opening a dialog so aria-hidden is not applied while a trigger still has focus. */
export function blurActiveElement() {
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    active.blur();
  }
}
