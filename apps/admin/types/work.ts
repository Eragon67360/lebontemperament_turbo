// types/work.ts
export type Context = "choir" | "orchestra";

export interface WorkGroup {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  type: Context;
  order_index: number;
}

export interface Program {
  id: string;
  created_at: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface WorkNavigation {
  activeProgram: Program | null;
  programs: Program[];
  groups: WorkGroup[];
}
