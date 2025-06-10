export enum Permission {
  // Permissões de usuário
  VIEW_PROFILE = 'view_profile',
  EDIT_PROFILE = 'edit_profile',
  
  // Permissões de currículo
  ANALYZE_RESUME = 'analyze_resume',
  VIEW_RESUME_ANALYSIS = 'view_resume_analysis',
  
  // Permissões de mentoria
  REQUEST_MENTORSHIP = 'request_mentorship',
  VIEW_MENTORSHIP = 'view_mentorship',
  
  // Permissões de admin
  MANAGE_USERS = 'manage_users',
  MANAGE_MENTORS = 'manage_mentors',
  MANAGE_AGENCIES = 'manage_agencies',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SETTINGS = 'manage_settings'
}

export type PermissionType = keyof typeof Permission

// Mapeamento de roles para permissões
export const rolePermissions: Record<string, Permission[]> = {
  user: [
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.ANALYZE_RESUME,
    Permission.VIEW_RESUME_ANALYSIS,
    Permission.REQUEST_MENTORSHIP,
    Permission.VIEW_MENTORSHIP
  ],
  mentor: [
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.ANALYZE_RESUME,
    Permission.VIEW_RESUME_ANALYSIS,
    Permission.REQUEST_MENTORSHIP,
    Permission.VIEW_MENTORSHIP,
    Permission.MANAGE_MENTORS
  ],
  admin: [
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.ANALYZE_RESUME,
    Permission.VIEW_RESUME_ANALYSIS,
    Permission.REQUEST_MENTORSHIP,
    Permission.VIEW_MENTORSHIP,
    Permission.MANAGE_USERS,
    Permission.MANAGE_MENTORS,
    Permission.MANAGE_AGENCIES,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SETTINGS
  ]
}

export type UserRole = 'student' | 'agency' | 'admin' | 'moderator'

export interface JwtPayload {
  aud: string
  exp: number
  sub: string
  email: string
  phone: string
  app_metadata: {
    provider: string
    providers: string[]
  }
  user_metadata: {
    avatar_url: string
    email: string
    email_verified: boolean
    full_name: string
    iss: string
    name: string
    picture: string
    provider_id: string
    sub: string
  }
  role: UserRole
  user_role: UserRole
} 