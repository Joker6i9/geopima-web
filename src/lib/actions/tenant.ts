"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, api } from "../api/client";
import { requireRole } from "../session";

export type StkStatus = "pending" | "success" | "cancelled" | "failed" | "timeout";
interface Stk { id: number; status: StkStatus; amount: number; phone: string; result_desc: string; receipt: string }

const input = z.object({
  amount: z.coerce.number({ error: "Enter the amount to pay." }).int("Enter whole shillings.").min(1, "Enter the amount to pay.").max(150_000, "The most M-Pesa allows at once is KES 150,000."),
  phone: z.string().trim().max(20).optional(),
});

/** The tenant asks for an M-Pesa PIN prompt on their phone. */
export async function startPaymentAction(raw: { amount: string; phone: string }): Promise<{ ok: true; id: number } | { ok: false; message: string }> {
  await requireRole("tenant");
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  try {
    const stk = await api<Stk>("/portal/tenant/pay/", { method: "POST", body: JSON.stringify(parsed.data) });
    return { ok: true, id: stk.id };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, message: e.message };
    throw e;
  }
}

/** Where a PIN prompt has got to. Called every few seconds while the tenant is entering their PIN. */
export async function checkPaymentAction(id: number): Promise<{ status: StkStatus; message: string }> {
  await requireRole("tenant");
  try {
    const stk = await api<Stk>(`/portal/tenant/pay/${Number(id)}/`);
    if (stk.status === "success") revalidatePath("/tenant", "layout");
    return { status: stk.status, message: stk.result_desc };
  } catch (e) {
    if (e instanceof ApiError) return { status: "failed", message: e.message };
    throw e;
  }
}
