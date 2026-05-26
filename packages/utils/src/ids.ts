import { randomUUID } from 'crypto'
export const generateId = () => randomUUID()
export function generateIdempotencyKey(
  tenantId: string,
  customerId: string,
  providerId: string,
  startsAt: Date,
): string {
  return `${tenantId}:${customerId}:${providerId}:${startsAt.toISOString()}`
}
