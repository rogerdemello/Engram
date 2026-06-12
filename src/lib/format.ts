export const short = (s: string, n = 6): string =>
  s ? `${s.slice(0, n)}…${s.slice(-4)}` : "";

export const shortBlob = (s: string, n = 8): string =>
  s ? `${s.slice(0, n)}…` : "";
