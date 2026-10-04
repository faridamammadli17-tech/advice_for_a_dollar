import {
  ProviderNotConfiguredError,
  type CallbackVerdict,
  type CheckoutInput,
  type CheckoutSession,
  type PaymentProvider,
} from './index';

/**
 * Payriff adapter — NOT IMPLEMENTED, deliberately.
 *
 * Every value marked TODO(provider-docs) must come from Payriff's own
 * documentation or merchant dashboard. None of it is guessed here, because an
 * invented endpoint or field name that looks right and fails in production is
 * worse than a function that refuses to run and says why.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS NEEDED TO FINISH THIS
 * ---------------------------------------------------------------------------
 * 1. The checkout endpoint URL, its request shape, and its authentication.
 * 2. The exact credential names Payriff issues, so `.env.example` can be
 *    corrected — the current placeholders are guesses at naming only.
 * 3. The callback signature algorithm, and which header or field carries it.
 *    This is the security-critical part: without verifying the signature, any
 *    stranger who finds the callback URL can claim a payment succeeded.
 * 4. The callback payload shape: where the transaction id, the amount and the
 *    currency live, and what units the amount is in.
 * 5. The refund endpoint, and whether it takes the transaction id alone.
 *
 * Until then this throws, loudly, at the point of use — the mock provider runs
 * the whole flow in development, so nothing is blocked by this being unfinished.
 */
export class PayriffProvider implements PaymentProvider {
  readonly id = 'payriff';

  async createCheckout(_input: CheckoutInput): Promise<CheckoutSession> {
    // TODO(provider-docs): POST to Payriff's checkout endpoint and return the
    // transaction id plus either a redirectUrl or a clientToken.
    throw new ProviderNotConfiguredError('payriff', 'the checkout endpoint is unknown');
  }

  async verifyCallback(
    _payload: unknown,
    _headers: Record<string, string>,
  ): Promise<CallbackVerdict> {
    // TODO(provider-docs): verify the signature FIRST, then read the amount.
    // Returning ok:true without a verified signature would let anyone who
    // finds this URL mark any submission as paid.
    throw new ProviderNotConfiguredError('payriff', 'the callback signature scheme is unknown');
  }

  async refund(_transactionId: string): Promise<{ ok: boolean; reason?: string }> {
    // TODO(provider-docs): call Payriff's refund endpoint with the transaction id.
    throw new ProviderNotConfiguredError('payriff', 'the refund endpoint is unknown');
  }
}
