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
    type: c.type,
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
  const body = await req.json();
  const { fleet, ...companyFields } = body;

  // 1. Insert company
  const { data: company, error: companyError } = await supabaseServer
    .from("rental_companies")
    .insert({
      slug: companyFields.slug,
      dealer_id: companyFields.dealer_id,
      name: companyFields.name,
      type: companyFields.type,
      tagline: companyFields.tagline ?? "",
      description: companyFields.description ?? "",
      area: companyFields.area ?? "",
      price_from: companyFields.price_from ?? "",
      price_period: companyFields.price_period ?? "",
      features: companyFields.features ?? "[]",
      website: companyFields.website ?? "",
      phone: companyFields.phone ?? "",
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

  if (companyError) {
    console.error("POST rental-companies:", companyError.message);
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  // 2. Insert fleet rows
  if (Array.isArray(fleet) && fleet.length > 0) {
    const { error: fleetError } = await supabaseServer
      .from("rental_company_fleet")
      .insert(
        fleet.map((f: any) => ({
          rental_company_id: company.id,
          model: f.model,
          image_id: f.image_id ?? null,
          price_from: f.price_from ?? "",
          price_period: f.price_period ?? "",
          range_km: f.range_km ?? 0,
          seats: f.seats ?? 5,
          accel: f.accel ?? "",
          charge_time: f.charge_time ?? "",
          body_type: f.body_type ?? "",
        })),
      );

    if (fleetError) {
      console.error("POST fleet insert:", fleetError.message);
      // Company was created; don't fail the whole request
    }
  }

  return NextResponse.json(company, { status: 201 });
}
