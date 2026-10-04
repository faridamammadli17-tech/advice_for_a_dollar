/**
 * Payment provider abstraction.
 *
 * Two providers are in scope for Phase 5, Epoint and Payriff, and both settle
 * in AZN. Everything in Phases 2–4 runs on the mock, and the whole flow must
 * work end to end on it.
 *
 * TODO(provider-docs): request shapes, credential names, signature algorithms
 * and callback payloads must all come from Epoint's and Payriff's own
 * documentation. None of it is guessed here — an invented field name that
 * looks plausible is worse than an obvious gap.
 */

export type CheckoutInput = {
  readonly amountMinorUnits: number;
  readonly currency: 'AZN';
  readonly submissionId: string;
};

export type CheckoutSession = {
  /** Where to send the visitor, for redirect-style providers. */
  readonly redirectUrl?: string;
  /** For providers that hand back a token for an embedded form. */
  readonly clientToken?: string;
  readonly transactionId: string;
};

export type CallbackResult = {
  readonly ok: boolean;
  /**
   * The amount the PROVIDER says was captured. Always trust this over anything
   * the client reported — a client-supplied amount is a suggestion, not a fact.
   */
  readonly amountMinorUnits: number;
  readonly submissionId: string;
  readonly transactionId: string;
};

export interface PaymentProvider {
  readonly id: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  verifyCallback(payload: unknown): Promise<CallbackResult>;
  /** Refunds work from the transaction id alone — no visitor contact needed. */
  refund(transactionId: string): Promise<{ ok: boolean }>;
}

export type PaymentFailure = {
  readonly kind: 'declined' | 'network' | 'cancelled';
  readonly message: string;
};
