/**
 * Plan limits configuration
 * Defines resource limits for each subscription plan
 */

export const PLAN_LIMITS = {
  free: {
    connections: 1,
    bases: 3,
    members: 5,
    retention_days: 30,
  },
  pro: {
    connections: 5,
    bases: 10,
    members: 20,
    retention_days: 90,
  },
  enterprise: {
    connections: Infinity,
    bases: Infinity,
    members: Infinity,
    retention_days: 365,
  },
} as const

export type PlanType = keyof typeof PLAN_LIMITS

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanType] || PLAN_LIMITS.free
}

export function canAddBase(plan: string, currentCount: number): boolean {
  const limits = getPlanLimits(plan)
  return currentCount < limits.bases
}

export function canAddMember(plan: string, currentCount: number): boolean {
  const limits = getPlanLimits(plan)
  return currentCount < limits.members
}

export function canAddConnection(plan: string, currentCount: number): boolean {
  const limits = getPlanLimits(plan)
  return currentCount < limits.connections
}
