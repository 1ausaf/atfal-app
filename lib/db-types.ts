export type UserRole = "tifl" | "local_nazim" | "regional_nazim";

export interface User {
  id: string;
  member_code: string;
  role: UserRole;
  majlis_id: string | null;
  name: string | null;
  age: number | null;
  age_group: string | null;
  profile_completed: boolean;
  date_of_birth?: string | null;
  salat_superstar?: boolean;
  created_at?: string;
  updated_at?: string;
}
