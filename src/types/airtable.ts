// Airtable Connection Types für PROJ-2

export type ConnectionStatus = "active" | "disconnected" | "pending_sync" | "error"

export type OrgRole = "owner" | "admin" | "member" | "viewer"

export type PlanType = "free" | "pro" | "enterprise"

export interface AirtableConnection {
  id: string
  org_id: string
  connected_by_user_id: string
  airtable_user_id: string
  airtable_email: string
  status: ConnectionStatus
  workspace_count: number
  base_count: number
  token_expires_at: string | null
  last_sync_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface AirtableWorkspace {
  id: string
  connection_id: string
  airtable_workspace_id: string
  name: string
  created_at: string
}

export interface AirtableBase {
  id: string
  workspace_id: string
  airtable_base_id: string
  name: string
  created_at: string
}

export interface Organization {
  id: string
  name: string
  plan: PlanType
  created_at: string
}

export interface OrganizationMember {
  user_id: string
  org_id: string
  role: OrgRole
  joined_at: string
}

// Plan limits configuration
export const PLAN_LIMITS: Record<PlanType, number> = {
  free: 1,
  pro: 5,
  enterprise: Infinity,
}

// Helper type for user context
export interface UserOrgContext {
  organization: Organization
  role: OrgRole
  canManageConnections: boolean // true for owner/admin
}
