"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useDealerAuth } from "@/app/contexts/dealer-auth";
import { UserCircle, KeyRound, Building2, Car } from "lucide-react";

const AREA_OPTIONS = ["Central", "North", "South", "East", "West"];

const RENTAL_TYPE_OPTIONS = [
  "Car Sharing",
  "Subscription",
  "Long-term Lease",
  "Short-term Rental",
];

interface RentalCompanyRow {
  id: number;
  types: string[] | null;
  price_from: string | null;
  price_period: string | null;
  min_term: string | null;
  deposit_required: string | null;
  requires_license_years: number | null;
  includes_insurance: boolean | null;
  includes_maintenance: boolean | null;
}

interface Account {
  id: number;
  name: string;
  email: string;
  role: "admin" | "dealer";
  phone: string | null;
  whatsapp_number: string | null;
  area: string | null;
  short_name: string | null;
  brands: string[] | null;
  address: string | null;
  website: string | null;
  hours: string | null;
  established: number | null;
  showrooms: number | null;
  description: string | null;
  highlights: string[] | null;
  certifications: string[] | null;
}

interface Props {
  showDealerFields?: boolean;
  dealerId?: number;
  initialRentalCompany?: RentalCompanyRow | null;
}

export default function AccountSettingsForm({
  showDealerFields,
  dealerId,
  initialRentalCompany,
}: Props) {
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

  // Business profile (dealer only)
  const [shortName, setShortName] = useState("");
  const [businessArea, setBusinessArea] = useState("Central");
  const [brands, setBrands] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [hours, setHours] = useState("");
  const [established, setEstablished] = useState("");
  const [showrooms, setShowrooms] = useState("1");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState("");
  const [certifications, setCertifications] = useState("");
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);

  // Rental profile (dealer only)
  const [rentalCompanyId, setRentalCompanyId] = useState<number | null>(
    initialRentalCompany?.id ?? null,
  );
  const [rentalTypes, setRentalTypes] = useState<string[]>(
    initialRentalCompany?.types ?? [],
  );
  const [rentalPriceFrom, setRentalPriceFrom] = useState(
    initialRentalCompany?.price_from ?? "",
  );
  const [rentalPricePeriod, setRentalPricePeriod] = useState(
    initialRentalCompany?.price_period ?? "/day",
  );
  const [rentalMinTerm, setRentalMinTerm] = useState(
    initialRentalCompany?.min_term ?? "",
  );
  const [rentalDeposit, setRentalDeposit] = useState(
    initialRentalCompany?.deposit_required ?? "",
  );
  const [rentalLicenseYears, setRentalLicenseYears] = useState(
    String(initialRentalCompany?.requires_license_years ?? 2),
  );
  const [rentalIncludesInsurance, setRentalIncludesInsurance] = useState(
    !!initialRentalCompany?.includes_insurance,
  );
  const [rentalIncludesMaintenance, setRentalIncludesMaintenance] = useState(
    !!initialRentalCompany?.includes_maintenance,
  );
  const [isSavingRental, setIsSavingRental] = useState(false);
  const [isDeletingRental, setIsDeletingRental] = useState(false);

  function toggleRentalType(v: string) {
    setRentalTypes((prev) =>
      prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v],
    );
  }

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
          setShortName(data.short_name ?? "");
          setBusinessArea(data.area ?? "Central");
          setBrands((data.brands ?? []).join(", "));
          setAddress(data.address ?? "");
          setWebsite(data.website ?? "");
          setHours(data.hours ?? "");
          setEstablished(data.established ? String(data.established) : "");
          setShowrooms(data.showrooms ? String(data.showrooms) : "1");
          setDescription(data.description ?? "");
          setHighlights((data.highlights ?? []).join("\n"));
          setCertifications((data.certifications ?? []).join(", "));
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

  async function handleSaveBusinessProfile() {
    setIsSavingBusiness(true);
    try {
      const body = {
        shortName,
        area: businessArea,
        brands: brands.split(",").map((s) => s.trim()).filter(Boolean),
        address,
        website,
        hours,
        established: established || null,
        showrooms,
        description,
        highlights: highlights.split("\n").map((s) => s.trim()).filter(Boolean),
        certifications: certifications.split(",").map((s) => s.trim()).filter(Boolean),
      };

      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Failed to save changes");

      setAccount(json);
      toast({ title: "Business profile updated" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSavingBusiness(false);
    }
  }

  async function handleSaveRentalProfile() {
    if (rentalTypes.length === 0) return;
    setIsSavingRental(true);
    try {
      const payload = {
        dealer_id: dealerId,
        types: rentalTypes,
        price_from: rentalPriceFrom,
        price_period: rentalPricePeriod,
        min_term: rentalMinTerm,
        deposit_required: rentalDeposit,
        includes_insurance: rentalIncludesInsurance,
        includes_maintenance: rentalIncludesMaintenance,
        requires_license_years: parseInt(rentalLicenseYears) || 2,
      };

      const url = rentalCompanyId
        ? `/api/rental-companies/${rentalCompanyId}`
        : "/api/rental-companies";
      const method = rentalCompanyId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Failed to save");

      if (!rentalCompanyId) setRentalCompanyId(json.id);
      toast({
        title: rentalCompanyId
          ? "Rental profile updated"
          : "Rental listings enabled",
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSavingRental(false);
    }
  }

  async function handleDeleteRentalListing() {
    if (!rentalCompanyId) return;
    if (
      !confirm(
        "Remove your rental listing? This will also delete your fleet cars and cannot be undone.",
      )
    )
      return;

    setIsDeletingRental(true);
    try {
      const res = await fetch(`/api/rental-companies/${rentalCompanyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove listing");
      setRentalCompanyId(null);
      setRentalTypes([]);
      toast({ title: "Rental listing removed" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsDeletingRental(false);
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

      {/* Business Profile */}
      {showDealerFields && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-base font-semibold">
                Business Profile
              </CardTitle>
            </div>
            <p className="text-xs text-slate-400 pl-12">
              Shown on your public dealer page. Contact an admin to change
              your dealer name or URL.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="shortName">Short Name</Label>
                <Input
                  id="shortName"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder={name}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="businessArea">Area</Label>
                <Select value={businessArea} onValueChange={setBusinessArea}>
                  <SelectTrigger id="businessArea">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AREA_OPTIONS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brands">Brands (comma separated)</Label>
              <Input
                id="brands"
                value={brands}
                onChange={(e) => setBrands(e.target.value)}
                placeholder="e.g. Tesla, BYD"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hours">Opening Hours</Label>
                <Input
                  id="hours"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Mon–Sat 9am–7pm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="established">Est. Year</Label>
                <Input
                  id="established"
                  type="number"
                  value={established}
                  onChange={(e) => setEstablished(e.target.value)}
                  placeholder="e.g. 1990"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="showrooms">Showrooms</Label>
                <Input
                  id="showrooms"
                  type="number"
                  min="1"
                  value={showrooms}
                  onChange={(e) => setShowrooms(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="highlights">Highlights (one per line)</Label>
              <Textarea
                id="highlights"
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                rows={3}
                placeholder={"Authorised BYD dealer\n125+ years of heritage"}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="certifications">Certifications (comma separated)</Label>
              <Input
                id="certifications"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveBusinessProfile} disabled={isSavingBusiness}>
                {isSavingBusiness ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rental Profile */}
      {showDealerFields && (
        <Card id="rental-profile" className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Car className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-semibold">
                Rental Profile
              </CardTitle>
            </div>
            <p className="text-xs text-slate-400 pl-12">
              Set your EV rental pricing and terms. Manage your fleet cars
              and FAQs from the My Rentals page.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {!rentalCompanyId && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800">
                You haven&apos;t enabled EV rental listings yet. Pick at
                least one rental type below and save to get started.
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Rental type *</Label>
              <div className="flex flex-wrap gap-2">
                {RENTAL_TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleRentalType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      rentalTypes.includes(t)
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="rentalPriceFrom">Price from</Label>
                <Input
                  id="rentalPriceFrom"
                  value={rentalPriceFrom}
                  onChange={(e) => setRentalPriceFrom(e.target.value)}
                  placeholder="S$80"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rentalPricePeriod">Period</Label>
                <Input
                  id="rentalPricePeriod"
                  value={rentalPricePeriod}
                  onChange={(e) => setRentalPricePeriod(e.target.value)}
                  placeholder="/day"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="rentalMinTerm">Min term</Label>
                <Input
                  id="rentalMinTerm"
                  value={rentalMinTerm}
                  onChange={(e) => setRentalMinTerm(e.target.value)}
                  placeholder="1 day"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rentalDeposit">Deposit required</Label>
                <Input
                  id="rentalDeposit"
                  value={rentalDeposit}
                  onChange={(e) => setRentalDeposit(e.target.value)}
                  placeholder="S$500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rentalLicenseYears">
                  License years required
                </Label>
                <Input
                  id="rentalLicenseYears"
                  type="number"
                  value={rentalLicenseYears}
                  onChange={(e) => setRentalLicenseYears(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={rentalIncludesInsurance}
                  onChange={(e) =>
                    setRentalIncludesInsurance(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-500"
                />
                Includes insurance
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={rentalIncludesMaintenance}
                  onChange={(e) =>
                    setRentalIncludesMaintenance(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-500"
                />
                Includes maintenance
              </label>
            </div>

            <div className="flex items-center justify-between gap-4">
              {rentalCompanyId ? (
                <Button
                  variant="ghost"
                  onClick={handleDeleteRentalListing}
                  disabled={isDeletingRental}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  {isDeletingRental ? "Removing…" : "Remove rental listing"}
                </Button>
              ) : (
                <div />
              )}
              <Button
                onClick={handleSaveRentalProfile}
                disabled={isSavingRental || rentalTypes.length === 0}
              >
                {isSavingRental
                  ? "Saving…"
                  : rentalCompanyId
                    ? "Save changes"
                    : "Enable rental listings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
