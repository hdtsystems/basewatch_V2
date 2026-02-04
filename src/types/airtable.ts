// Airtable Connection Types für PROJ-2 und PROJ-3

export type ConnectionStatus = "active" | "disconnected" | "pending_sync" | "error"

export type OrgRole = "owner" | "admin" | "member" | "viewer"

export type PlanType = "free" | "pro" | "enterprise"

export type OnboardingStep = 1 | 2 | 3 | 4

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired"

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

// Plan limits configuration - für Verbindungen
export const PLAN_LIMITS: Record<PlanType, number> = {
  free: 1,
  pro: 5,
  enterprise: Infinity,
}

// Plan limits für alle Ressourcen (PROJ-3)
export interface PlanLimits {
  connections: number
  bases: number
  members: number
  retentionDays: number
}

export const PLAN_LIMITS_FULL: Record<PlanType, PlanLimits> = {
  free: {
    connections: 1,
    bases: 3,
    members: 5,
    retentionDays: 30,
  },
  pro: {
    connections: 5,
    bases: 10,
    members: 20,
    retentionDays: 90,
  },
  enterprise: {
    connections: Infinity,
    bases: Infinity,
    members: Infinity,
    retentionDays: 365,
  },
}

// Helper type for user context
export interface UserOrgContext {
  organization: Organization
  role: OrgRole
  canManageConnections: boolean // true for owner/admin
}

// Onboarding Types (PROJ-3)
export interface OnboardingStatus {
  id: string
  user_id: string
  current_step: OnboardingStep
  completed_at: string | null
  organization_id: string | null
  created_at: string
  updated_at: string
}

// E-Mail Delivery Status für Einladungen (EC-11)
export type EmailDeliveryStatus = "pending" | "sent" | "delivered" | "failed" | "bounced"

// Organization Invitation (PROJ-3)
export interface OrganizationInvitation {
  id: string
  organization_id: string
  email: string
  role: OrgRole
  invited_by: string
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
  // EC-11: E-Mail-Zustellungsstatus
  delivery_status?: EmailDeliveryStatus
  delivery_attempts?: number
  last_delivery_error?: string | null
  organization?: Organization
  inviter?: {
    email: string
    full_name: string | null
  }
}

// Monitored Base (PROJ-3)
export interface MonitoredBase {
  id: string
  organization_id: string
  airtable_base_id: string
  is_active: boolean
  activated_at: string
  deactivated_at: string | null
  created_at: string
}

// Extended Organization with more details (PROJ-3)
export interface OrganizationFull extends Organization {
  slug: string
  description: string | null
  logo_url: string | null
  updated_at: string
  updated_by: string | null
  member_count?: number
  base_count?: number
  connection_count?: number
}

// Organization Member with user details (PROJ-3)
export interface OrganizationMemberFull extends OrganizationMember {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

// Base with workspace info for selection (PROJ-3)
export interface BaseWithWorkspace extends AirtableBase {
  workspace: AirtableWorkspace
  connection: {
    airtable_email: string
  }
  is_monitored: boolean
  last_sync_at: string | null
}
