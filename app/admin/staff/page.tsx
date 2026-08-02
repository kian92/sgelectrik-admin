"use client";

import { FormEvent, useEffect, useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
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

  async function changeRole(id: number, nextRole: Role) {
    const res = await fetch(`/api/internal-staff/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: nextRole }) });
    const data = await res.json();
    if (res.ok) setStaff((current) => current.map((person) => person.id === id ? data : person));
    else setMessage(data.error ?? "Unable to update role.");
  }

  return <div className="max-w-5xl mx-auto p-6"><div className="flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-emerald-600" /><div><h1 className="text-2xl font-bold text-slate-900">Internal Staff</h1><p className="text-sm text-slate-500">Superadmins have full access. Editors can only manage the blog.</p></div></div><div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]"><form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 font-semibold"><UserPlus className="h-4 w-4" />Add staff</h2><div><Label htmlFor="name">Name</Label><Input id="name" name="name" required minLength={2} className="mt-1" /></div><div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required className="mt-1" /></div><div><Label htmlFor="password">Temporary password</Label><Input id="password" name="password" type="password" required minLength={8} className="mt-1" /></div><div><Label htmlFor="role">Role</Label><select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"><option value="editor">Editor — blog only</option><option value="superadmin">Superadmin — full access</option></select></div><Button disabled={saving} className="w-full">{saving ? "Adding…" : "Add staff"}</Button>{message && <p role="status" className="text-sm text-slate-600">{message}</p>}</form><div className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="border-b px-5 py-4 font-semibold">Staff accounts</div>{loading ? <p className="p-5 text-sm text-slate-500">Loading…</p> : staff.length === 0 ? <p className="p-5 text-sm text-slate-500">No internal staff yet.</p> : <div className="divide-y">{staff.map((person) => <div key={person.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-slate-900">{person.name}</p><p className="text-sm text-slate-500">{person.email}</p></div><select value={person.role} onChange={(e) => void changeRole(person.id, e.target.value as Role)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"><option value="editor">Editor</option><option value="superadmin">Superadmin</option></select></div>)}</div>}</div></div></div>;
}
