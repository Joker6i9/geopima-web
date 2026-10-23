import type { Role } from "./types";

export const ROLES: Role[] = ["admin", "tenant", "landlord"];

export const isRole = (v: string | undefined): v is Role => !!v && (ROLES as string[]).includes(v);

export const homeFor = (role: Role) =>
  role === "admin" ? "/admin/dashboard" : role === "tenant" ? "/tenant" : "/landlord";
