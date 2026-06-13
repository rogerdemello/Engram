import "server-only";

/**
 * Sensitivity classification.
 *
 * Every memory is encrypted at rest on Walrus by MemWal. On top of that,
 * Engram tags each fact's *sensitivity* so the UI and the consent layer can
 * treat health/financial/identity data more carefully (sensitive memories
 * are surfaced as locked and require explicit per-app consent to share).
 *
 * Rule-based so it works with zero external dependencies; deterministic and
 * fast for a live demo.
 */
const SENSITIVE_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "health", re: /\b(allerg|anaphyla|asthma|diabet|medication|prescri|diagnos|disease|condition|blood type|disorder|therapy|mental health|pregnan)\w*/i },
  { label: "health", re: /\b(vegan|vegetarian|gluten[- ]?free|lactose|kosher|halal|celiac)\b/i },
  { label: "finance", re: /\b(salary|income|net worth|bank|credit card|iban|account number|crypto wallet|seed phrase|private key)\w*/i },
  { label: "identity", re: /\b(ssn|social security|passport|driver'?s? licen|date of birth|dob|home address)\w*/i },
  { label: "credential", re: /\b(password|pin|2fa|otp|api key|secret)\w*/i },
];

export interface Sensitivity {
  sensitive: boolean;
  label?: string;
}

export function classify(text: string): Sensitivity {
  for (const { label, re } of SENSITIVE_PATTERNS) {
    if (re.test(text)) return { sensitive: true, label };
  }
  return { sensitive: false };
}
