export function uuid(): string {
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  return globalThis.crypto.randomUUID();
}
