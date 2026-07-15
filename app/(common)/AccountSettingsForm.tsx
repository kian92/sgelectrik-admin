"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useDealerAuth } from "@/app/contexts/dealer-auth";
import { UserCircle, KeyRound } from "lucide-react";

interface Account {
  id: number;
  name: string;
  email: string;
  role: "admin" | "dealer";
  phone: string | null;
  whatsapp_number: string | null;
  area: string | null;
}

interface Props {
  showDealerFields?: boolean;
}

export default function AccountSettingsForm({ showDealerFields }: Props) {
  const { refresh } = useDealerAuth();

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("+65 ");
  const [area, setArea] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/account");
        if (res.ok) {
          const data: Account = await res.json();
          setAccount(data);
          setName(data.name ?? "");
          setPhone(data.phone ?? "");
          setWhatsappNumber(data.whatsapp_number ?? "+65 ");
          setArea(data.area ?? "");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveProfile() {
    if (!name.trim()) return;
    setIsSavingProfile(true);
    try {
      const body: Record<string, string> = { name };
      if (showDealerFields) {
        body.phone = phone;
        body.whatsappNumber = whatsappNumber;
        body.area = area;
      }

      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Failed to save changes");

      setAccount(json);
      await refresh();
      toast({ title: "Profile updated" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Failed to change password");

      toast({ title: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (loading) {
    return <p className="text-slate-400 text-sm py-8 text-center">Loading…</p>;
  }

  const passwordValid =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword.length > 0;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <CardTitle className="text-base font-semibold">Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" value={account?.email ?? ""} disabled />
            <p className="text-xs text-slate-400">
              Contact an admin to change your email address.
            </p>
          </div>

          {showDealerFields && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+65 6123 4567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="area">Area</Label>
                  <Input
                    id="area"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="East"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsappNumber">WhatsApp number</Label>
                <Input
                  id="whatsappNumber"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+65 8123 4567"
                />
                <p className="text-xs text-slate-400">
                  Include the country code. Consumer enquiries and test-drive
                  requests can be sent to this number through WhatsApp.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={isSavingProfile || !name.trim()}
            >
              {isSavingProfile ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-amber-600" />
            </div>
            <CardTitle className="text-base font-semibold">
              Update password
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p className="text-xs text-red-500">
              Password must be at least 8 characters.
            </p>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={isSavingPassword || !passwordValid}
            >
              {isSavingPassword ? "Updating…" : "Update password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
