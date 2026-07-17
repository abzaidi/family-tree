export type Gender = 'male' | 'female' | 'other';
export type UserRole = 'admin' | 'editor' | 'viewer';
export type AuditAction = 'create' | 'update' | 'delete' | 'restore';
export type DeleteOnlyMode = 'lineage' | 'spouse';

export interface DeleteContext {
  personId: string;
  isRoot: boolean;
  isLineageMember: boolean;
  isBranchingParent: boolean;
  canDeleteOnly: boolean;
  canDeleteBranch: boolean;
  deleteOnlyMode: DeleteOnlyMode;
  descendantCount: number;
}

export interface Person {
  id: string;
  serial_number: number;
  english_name: string;
  urdu_name: string;
  gender: Gender;
  birth_year: number | null;
  death_year: number | null;
  notes: string | null;
  country_iso_code: string | null;
  country_name: string | null;
  state_province_code: string | null;
  state_province: string | null;
  city_name: string | null;
  phone_country_code: string | null;
  deleted: boolean;
  created_at: string;
  updated_at: string;
  /** Populated only for editors/admins; never exposed to viewers. */
  national_identity_number?: string | null;
}

export interface PersonPrivateDetails {
  id: string;
  person_id: string;
  national_identity_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Union {
  id: string;
  partner1_id: string;
  partner2_id: string | null;
  marriage_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnionChild {
  id: string;
  union_id: string;
  child_id: string;
  created_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface AppUser {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  role: UserRole;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: AuditAction;
  table_name: string;
  record_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

export interface AppConfig {
  key: string;
  value: string;
}

// Form types
export interface PersonFormData {
  english_name: string;
  urdu_name: string;
  gender: Gender;
  birth_year: number | null;
  death_year: number | null;
  notes: string;
  country_iso_code: string;
  country_name: string;
  state_province_code: string;
  state_province: string;
  city_name: string;
  phone_country_code: string;
  national_identity_number: string;
}

// Tree rendering types
export interface FamilyNode {
  person: Person;
  unions: UnionWithDetails[];
  parentUnionId: string | null;
}

export interface UnionWithDetails {
  union: Union;
  partner: Person | null;
  children: Person[];
}

export type Locale = 'en' | 'ur';

export interface TranslationStrings {
  [key: string]: string;
}
