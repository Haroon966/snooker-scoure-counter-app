/** Light theme only — sets PWA chrome color */
export function initTheme() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = '#ffffff';
}
