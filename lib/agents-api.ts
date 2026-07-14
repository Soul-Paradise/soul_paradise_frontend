/**
 * Agent (B2B) registration API.
 *
 * These endpoints are multipart, not JSON, so they bypass the shared ApiClient
 * (which sets Content-Type: application/json). They are also all unauthenticated
 * — an agent has no session until an admin approves them — so there is no token
 * handling here either.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export type AgentStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface AgentRegistrationResponse {
  status: AgentStatus;
  message: string;
}

export interface ResubmissionDetails {
  agencyName: string;
  name: string;
  email: string;
  status: AgentStatus;
  rejectionReason: string | null;
  documents: Array<{ type: string; uploadedAt: string }>;
}

async function parseError(response: Response): Promise<never> {
  let message = 'Something went wrong. Please try again.';

  try {
    const body = await response.json();
    // Nest's ZodValidationPipe returns an array of messages; surface the first
    // one rather than "[object Object]".
    message = Array.isArray(body?.message)
      ? body.message[0]
      : body?.message || message;
  } catch {
    // Response wasn't JSON — keep the generic message.
  }

  throw new Error(message);
}

function buildFormData(
  fields: Record<string, string | File | undefined | null>,
): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    // Skip empty optionals — sending "" would fail the backend's format checks
    // on fields like gstNumber, which are optional but validated when present.
    if (value === undefined || value === null || value === '') continue;
    formData.append(key, value);
  }

  return formData;
}

/**
 * Verifies a Google credential for agent signup and checks the email is free.
 *
 * Note this is NOT /auth/google-auth — that would log the user straight in as a
 * customer. This only proves who they are; no account, no session.
 */
export async function verifyAgentGoogle(
  idToken: string,
): Promise<{ email: string; name: string }> {
  const response = await fetch(`${API_BASE_URL}/agents/google/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    return parseError(response);
  }

  return response.json();
}

export async function registerAgent(
  data: Record<string, string | File | undefined>,
): Promise<AgentRegistrationResponse> {
  const response = await fetch(`${API_BASE_URL}/agents/register`, {
    method: 'POST',
    // No Content-Type header: the browser must set the multipart boundary itself.
    body: buildFormData(data),
  });

  if (!response.ok) {
    return parseError(response);
  }

  return response.json();
}

export async function getResubmission(
  token: string,
): Promise<ResubmissionDetails> {
  const response = await fetch(
    `${API_BASE_URL}/agents/resubmit?token=${encodeURIComponent(token)}`,
  );

  if (!response.ok) {
    return parseError(response);
  }

  return response.json();
}

export async function resubmitDocuments(
  token: string,
  files: Record<string, File | undefined>,
): Promise<AgentRegistrationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/agents/resubmit?token=${encodeURIComponent(token)}`,
    { method: 'POST', body: buildFormData(files) },
  );

  if (!response.ok) {
    return parseError(response);
  }

  return response.json();
}
