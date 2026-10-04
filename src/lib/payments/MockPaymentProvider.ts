import {
  type CallbackResult,
  type CheckoutInput,
  type CheckoutSession,
  type PaymentProvider,
} from './types';

/**
 * The development payment provider.
 *
 * Everything works end to end on this one — that is the point. It also makes
 * the failure paths reachable on demand, because "payment failed" is a state
 * the visitor will actually meet and the spec is firm that it must never
 * destroy their written text.
 *
 * Trigger a failure by paying an amount ending in 13 qəpik (e.g. 1.13 AZN).
 * Crude, deliberate, and documented on the payment step in dev builds.
 */

const FAILURE_TRIGGER_REMAINDER = 13;
const SIMULATED_LATENCY_MS = 650;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function mockTransactionId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `mock_${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export class MockPaymentProvider implements PaymentProvider {
  readonly id = 'mock';

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    await wait(SIMULATED_LATENCY_MS);

    if (input.amountMinorUnits % 100 === FAILURE_TRIGGER_REMAINDER) {
      throw new Error('Mock provider: card declined.');
    }

    return {
      transactionId: mockTransactionId(),
      // No redirect: the mock captures immediately so the flow stays in-page.
    };
  }

  async verifyCallback(payload: unknown): Promise<CallbackResult> {
    // A real provider's payload is signed and must be verified before it is
    // believed. The mock simply echoes, but the shape is the real one so the
    // calling code does not change in Phase 5.
    const data = payload as Partial<CallbackResult> | null;
    return {
      ok: data?.ok ?? false,
      amountMinorUnits: data?.amountMinorUnits ?? 0,
      submissionId: data?.submissionId ?? '',
      transactionId: data?.transactionId ?? '',
    };
  }

  async refund(transactionId: string): Promise<{ ok: boolean }> {
    await wait(200);
    return { ok: transactionId.startsWith('mock_') };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
