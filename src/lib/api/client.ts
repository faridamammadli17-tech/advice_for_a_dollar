/**
 * Typed client for the API.
 *
 * Every call goes through `request`, so credentials, error shape and the
 * same-origin cookie policy are decided once. `credentials: 'same-origin'`
 * matters: the admin session is an httpOnly cookie, and without it every admin
 * call would quietly come back 401.
 */

export type ApiError = { ok: false; status: number; reason?: string };

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: true; data: T } | ApiError> {
  // Only declare a JSON content type when there is actually a JSON body.
  // Fastify rejects a POST that announces `application/json` and then sends
  // nothing with a 400, which is exactly what every body-less action endpoint
  // (approve, reject, logout) does. Sending the header unconditionally made
  // those buttons fail silently.
  const headers: Record<string, string> = { ...((init.headers as Record<string, string>) ?? {}) };
  if (init.body !== undefined && init.body !== null) {
    headers['content-type'] = 'application/json';
  }

  try {
    const response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers,
    });

    if (!response.ok) {
      let reason: string | undefined;
      try {
        reason = ((await response.json()) as { reason?: string }).reason;
      } catch {
        // no body, or not JSON — the status is enough
      }
      return { ok: false, status: response.status, reason };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch {
    // Network failure, server down, offline. Never throws at the call site.
    return { ok: false, status: 0, reason: 'network' };
  }
}

/* ------------------------------------------------------------------ admin */

export type AdminSubmission = {
  id: string;
  body: string;
  visibility: 'public' | 'private';
  status: 'pending' | 'answered' | 'deleted';
  public_state: 'not_requested' | 'in_review' | 'approved' | 'rejected';
  safety_flagged: number;
  safety_category: string | null;
  amount_minor_units: number;
  currency: string;
  category: string | null;
  created_at: string;
  answered_at: string | null;
  answer: string | null;
  follow_up_body: string | null;
  follow_up_reply: string | null;
};

export type AdminStats = {
  total: number;
  answered: number;
  pending: number;
  flagged: number;
  awaiting_review: number;
  revenue_minor_units: number;
};

export const api = {
  adminLogin: (password: string) =>
    request<{ ok: true }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  adminLogout: () => request<{ ok: true }>('/api/admin/logout', { method: 'POST' }),

  adminSubmissions: () =>
    request<{ submissions: AdminSubmission[] }>('/api/admin/submissions'),

  adminStats: () => request<{ stats: AdminStats }>('/api/admin/analytics'),

  answer: (id: string, answer: string) =>
    request<{ ok: boolean }>(`/api/admin/${id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    }),

  replyToFollowUp: (id: string, reply: string) =>
    request<{ ok: boolean }>(`/api/admin/${id}/follow-up-reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    }),

  approve: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/${id}/approve`, { method: 'POST' }),

  reject: (id: string) => request<{ ok: boolean }>(`/api/admin/${id}/reject`, { method: 'POST' }),

  setCategory: (id: string, category: string | null) =>
    request<{ ok: boolean }>(`/api/admin/${id}/category`, {
      method: 'POST',
      body: JSON.stringify({ category }),
    }),

  setFlag: (id: string, flagged: boolean, category: string | null) =>
    request<{ ok: boolean }>(`/api/admin/${id}/flag`, {
      method: 'POST',
      body: JSON.stringify({ flagged, category }),
    }),

  purgeEmails: () =>
    request<{ purged: number }>('/api/admin/purge-emails', { method: 'POST' }),
};

/* ---------------------------------------------------------------- visitor */

export type SafetyVerdict = {
  flagged: boolean;
  category: string | null;
  confidence: number;
  matchedRuleIds: string[];
};

export type VisitorSubmission = {
  body: string;
  visibility: 'public' | 'private';
  status: 'pending' | 'answered' | 'deleted';
  publicState: string;
  createdAt: string;
  answeredAt: string | null;
  answer: string | null;
  followUp: {
    body: string;
    createdAt: string;
    reply: string | null;
    repliedAt: string | null;
  } | null;
  amountMinorUnits: number;
  currency: string;
};

export type PublicProblem = {
  id: string;
  body: string;
  answer: string;
  category: string | null;
  created_at: string;
  answered_at: string | null;
};

export type SubmitInput = {
  body: string;
  secretWord: string;
  visibility: 'public' | 'private';
  amountMinorUnits: number;
  email: string | null;
  transactionId: string | null;
};

export type SubmitResult =
  | { ok: true; token: string }
  | { ok: false; blocked: true; category: string | null };

export const visitorApi = {
  /**
   * Screen before payment. The server screens again on submit regardless —
   * this call exists so the interstitial can appear immediately, not so the
   * browser can decide anything.
   */
  screen: (body: string) =>
    request<SafetyVerdict>('/api/screen', { method: 'POST', body: JSON.stringify({ body }) }),

  submit: (input: SubmitInput) =>
    request<SubmitResult>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getByToken: (token: string) =>
    request<{ ok: true; submission: VisitorSubmission }>(`/api/a/${encodeURIComponent(token)}`),

  sendFollowUp: (token: string, body: string) =>
    request<{ ok: boolean }>(`/api/a/${encodeURIComponent(token)}/follow-up`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  deleteSubmission: (token: string) =>
    request<{ ok: boolean }>(`/api/a/${encodeURIComponent(token)}`, { method: 'DELETE' }),

  archive: (category: string, sort: string) =>
    request<{ problems: PublicProblem[] }>(
      `/api/archive?category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}`,
    ),

  problem: (id: string) =>
    request<{ problem: PublicProblem }>(`/api/problem/${encodeURIComponent(id)}`),
};
