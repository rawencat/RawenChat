const KEY_PATTERN =
  /^(?:[a-zA-Z0-9]|F(?:1[0-2]|[1-9])|space|enter|escape|backspace|tab|up|down|left|right|shift|ctrl|alt|win)$/i;

export function isValidKey(key: string): boolean {
  return KEY_PATTERN.test(key.trim());
}
