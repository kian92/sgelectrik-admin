// app/api/rental-companies/route.ts
import { supabaseServer } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: companies, error: companiesError } = await supabaseServer
    .from("rental_companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (companiesError)
    return NextResponse.json(
      { error: companiesError.message },
      { status: 500 },
    );

  const { data: fleet } = await supabaseServer
    .from("rental_company_fleet")
    .select("id, rental_company_id, model");

  const result = (companies ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    dealerId: c.dealer_id,
    name: c.name,
    types: c.types ?? (c.type ? [c.type] : []),
    tagline: c.tagline,
    description: c.description,
    area: c.area,
    priceFrom: c.price_from,
    pricePeriod: c.price_period,
    rating: c.rating,
    reviewCount: c.review_count,
    website: c.website,
    phone: c.phone,
    minTerm: c.min_term,
    depositRequired: c.deposit_required,
    includesInsurance: c.includes_insurance,
    includesMaintenance: c.includes_maintenance,
    requiresLicenseYears: c.requires_license_years,
    fleet: (fleet ?? [])
      .filter((f) => f.rental_company_id === c.id)
      .map((f) => ({ id: f.id, model: f.model })),
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const companyFields = await req.json();

  // When the dealer-facing form omits identity fields (name/slug/website/
  // phone/area), derive them from the owning dealer's own record.
  let { name, slug, website, phone, area } = companyFields;
  if (!name && companyFields.dealer_id) {
    const { data: dealerRow } = await supabaseServer
      .from("dealers")
      .select("name, slug, website, phone, area")
      .eq("id", companyFields.dealer_id)
      .maybeSingle();
    if (dealerRow) {
      name = dealerRow.name;
      slug = slug || `${dealerRow.slug}-rental`;
      website = website || dealerRow.website;
      phone = phone || dealerRow.phone;
      area = area || dealerRow.area;
    }
  }

  // 1. Insert company
  const { data: company, error: companyError } = await supabaseServer
    .from("rental_companies")
    .insert({
      slug,
      dealer_id: companyFields.dealer_id,
      name,
      types: companyFields.types ?? [],
      description: companyFields.description ?? "",
      area: area ?? "",
      price_from: companyFields.price_from ?? "",
      price_period: companyFields.price_period ?? "",
      features: companyFields.features ?? "[]",
      website: website ?? "",
      phone: phone ?? "",
      rating: companyFields.rating ?? 0,
      review_count: companyFields.review_count ?? 0,
      min_term: companyFields.min_term ?? "",
      deposit_required: companyFields.deposit_required ?? "",
      includes_insurance: companyFields.includes_insurance ?? false,
      includes_maintenance: companyFields.includes_maintenance ?? false,
      requires_license_years: companyFields.requires_license_years ?? 2,
    })
    .select()
    .single();

  if (companyError?.code === "23505") {
    return NextResponse.json(
      { error: "A rental company with this slug already exists." },
      { status: 409 },
    );
  }

  if (companyError) {
    console.error("POST rental-companies:", companyError.message);
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  return NextResponse.json(company, { status: 201 });
}
