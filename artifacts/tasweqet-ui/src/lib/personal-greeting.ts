/** Greetings use the saved name only; contact details are not a name fallback. */
export function personalGreeting(greeting: string, name?: string | null): string {
  const displayName = name?.trim();
  return displayName ? `${greeting} ${displayName}` : greeting;
}