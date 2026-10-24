"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = "editor" | "superadmin";
type Staff = { id: number; name: string; email: string; role: Role; status: string };

export default function InternalStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [role, setRole] = useState<Role>("editor");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetch("/api/internal-staff")
      .then(async (res) => ({ res, data: await res.json() }))
      .then(({ res, data }) => {
        if (res.ok) setStaff(data);
        else setMessage(data.error ?? "Unable to load staff.");
        setLoading(false);
      });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/internal-staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password"), role }) });
    const data = await res.json();
    if (res.ok) { setStaff((current) => [data, ...current]); event.currentTarget.reset(); setRole("editor"); setMessage("Staff member added."); }
    else setMessage(data.error ?? "Unable to add staff.");
    setSaving(false);
  }

  async function updateStaff(id: number, changes: { role?: Role; status?: string }) {
    setMessage("");
    const res = await fetch(`/api/internal-staff/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    const data = await res.json();
    if (res.ok) setStaff((current) => current.map((person) => person.id === id ? data : person));
    else setMessage(data.error ?? "Unable to update staff member.");
  }

  async function submitReset(event: FormEvent<HTMLFormElement>, person: Staff) {
    event.preventDefault(); setResetting(true); setMessage("");
    const res = await fetch(`/api/internal-staff/${person.id}/password`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword: resetPassword }) });
    const data = await res.json();
    if (res.ok) { setResetId(null); setResetPassword(""); setMessage(`Temporary password updated for ${person.email}.`); }
    else setMessage(data.error ?? "Unable to reset password.");
    setResetting(false);
  }

  return <div className="max-w-5xl mx-auto p-6"><div className="flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-emerald-600" /><div><h1 className="text-2xl font-bold text-slate-900">Internal Staff</h1><p className="text-sm text-slate-500">Superadmins have full access. Editors can only manage the blog.</p></div></div><div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]"><form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 font-semibold"><UserPlus className="h-4 w-4" />Add staff</h2><div><Label htmlFor="name">Name</Label><Input id="name" name="name" required minLength={2} className="mt-1" /></div><div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required className="mt-1" /></div><div><Label htmlFor="password">Temporary password</Label><Input id="password" name="password" type="password" required minLength={8} className="mt-1" /></div><div><Label htmlFor="role">Role</Label><select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"><option value="editor">Editor — blog only</option><option value="superadmin">Superadmin — full access</option></select></div><Button disabled={saving} className="w-full">{saving ? "Adding…" : "Add staff"}</Button>{message && <p role="status" className="text-sm text-slate-600">{message}</p>}</form><div className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="border-b px-5 py-4 font-semibold">Staff accounts</div>{loading ? <p className="p-5 text-sm text-slate-500">Loading…</p> : staff.length === 0 ? <p className="p-5 text-sm text-slate-500">No internal staff yet.</p> : <div className="divide-y">{staff.map((person) => <div key={person.id} className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-2 font-medium text-slate-900">{person.name}<span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${person.status === "active" ? "bg-emerald-50 text-emerald-700" : person.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{person.status}</span></p><p className="text-sm text-slate-500">{person.email}</p>{person.status !== "active" && <p className="text-xs text-amber-700">Cannot log in until active.</p>}</div><div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={() => { setResetId(resetId === person.id ? null : person.id); setResetPassword(""); }}><KeyRound className="h-4 w-4" />Reset password</Button><select aria-label="Status" value={person.status} onChange={(e) => void updateStaff(person.id, { status: e.target.value })} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">{person.status === "pending" && <option value="pending" disabled>Pending</option>}<option value="active">Active</option><option value="inactive">Inactive</option></select><select aria-label="Role" value={person.role} onChange={(e) => void updateStaff(person.id, { role: e.target.value as Role })} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"><option value="editor">Editor</option><option value="superadmin">Superadmin</option></select></div></div>{resetId === person.id && <form onSubmit={(e) => void submitReset(e, person)} className="mt-3 flex flex-col gap-2 sm:flex-row"><Input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="New temporary password (min 8 characters)" required minLength={8} autoComplete="new-password" /><Button disabled={resetting} size="sm">{resetting ? "Saving…" : "Save"}</Button><Button type="button" variant="ghost" size="sm" onClick={() => setResetId(null)}>Cancel</Button></form>}</div>)}</div>}</div></div></div>;
}
