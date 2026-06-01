let hapticEnabled = true;

export function setHapticEnabled(enabled) {
  hapticEnabled = enabled;
}

export function haptic() {
  if (!hapticEnabled) return;
  if (navigator.vibrate) navigator.vibrate(10);
}
