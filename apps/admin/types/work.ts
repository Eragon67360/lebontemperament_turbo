// types/work.ts
export type Context = "choir" | "orchestra";

export interface WorkGroup {
  id: string;
  created_at: string | null;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  type: string;
  order_index: number;
}

export interface Program {
  id: string;
  created_at: string | null;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean | null;
}

export interface WorkNavigation {
  activeProgram: Program | null;
  programs: Program[];
  groups: WorkGroup[];
}
