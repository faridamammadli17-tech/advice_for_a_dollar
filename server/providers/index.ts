/**
 * Payment provider adapters.
 *
 * ===========================================================================
 * NOTHING ABOUT EPOINT OR PAYRIFF IS GUESSED IN THIS DIRECTORY
 * ===========================================================================
 *
 * The spec is explicit: do not invent their API details. So the adapters below
 * define the shape the rest of the system needs and then stop, with a
 * `TODO(provider-docs)` at every point where a real value has to come from
 * their documentation.
 *
 * That is deliberately more useful than a plausible-looking implementation.
 * An invented endpoint that returns 404 in production is a worse outcome than
 * a function that refuses to run and says exactly which document would let it.
 *
 * What IS settled here, and what the rest of the system relies on:
 *
 *   - both providers settle in AZN, in minor units (qəpik)
 *   - a checkout produces a transaction id BEFORE the visitor is sent anywhere
 *   - a callback is verified server-side, signature first, amount second
 *   - a refund works from the transaction id alone
 */

export type CheckoutInput = {
  readonly amountMinorUnits: number;
  readonly currency: 'AZN';
  readonly submissionId: string | null;
  readonly returnUrl: string;
};

export type CheckoutSession = {
  readonly transactionId: string;
  /** Where to send the visitor, for redirect-style providers. */
  readonly redirectUrl?: string;
  /** For providers that hand back a token for an embedded form. */
  readonly clientToken?: string;
};

export type CallbackVerdict = {
  readonly ok: boolean;
  readonly transactionId: string;
  /** What the PROVIDER says was captured. Never what the browser claimed. */
  readonly amountMinorUnits: number;
  readonly submissionId: string | null;
  readonly failureReason?: string;
};

export interface PaymentProvider {
  readonly id: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  /**
   * Verify a callback. MUST check the provider's signature before believing
   * any field in the payload — an unverified callback is an unauthenticated
   * stranger telling you they paid.
   */
  verifyCallback(payload: unknown, headers: Record<string, string>): Promise<CallbackVerdict>;
  refund(transactionId: string): Promise<{ ok: boolean; reason?: string }>;
}

/** Thrown by an adapter that cannot run until its documentation is supplied. */
export class ProviderNotConfiguredError extends Error {
  constructor(provider: string, missing: string) {
    super(
      `${provider} is not configured: ${missing}. ` +
        `See the TODO(provider-docs) notes in server/providers/${provider}.ts.`,
    );
    this.name = 'ProviderNotConfiguredError';
  }
}
