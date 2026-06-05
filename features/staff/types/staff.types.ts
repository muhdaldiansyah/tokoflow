export type StaffRole = "owner" | "assistant";

export interface Staff {
  id: string;
  user_id: string;
  name: string;
  phone?: string | null;
  role: StaffRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffInput {
  name: string;
  phone?: string;
  role?: StaffRole;
}

export interface UpdateStaffInput {
  name?: string;
  phone?: string | null;
  role?: StaffRole;
  active?: boolean;
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Owner",
  assistant: "Assistant",
};
