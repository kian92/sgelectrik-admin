// app/api/rental-companies/[id]/route.ts
import { supabaseServer } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await supabaseServer
    .from("rental_companies")
    .select("*, rental_company_fleet(*)")
    .eq("id", id)
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { fleet, ...companyFields } = body;

  // 1. Update the company row
  const { data: company, error: companyError } = await supabaseServer
    .from("rental_companies")
    .update({
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
    .eq("id", id)
    .select()
    .single();

  if (companyError) {
    console.error("PUT rental-companies:", companyError.message);
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  // 2. Replace fleet — delete existing rows then insert new ones
  //    (cascade delete handles orphans; simpler than upsert for this use case)
  if (Array.isArray(fleet)) {
    await supabaseServer
      .from("rental_company_fleet")
      .delete()
      .eq("rental_company_id", id);

    if (fleet.length > 0) {
      const { error: fleetError } = await supabaseServer
        .from("rental_company_fleet")
        .insert(
          fleet.map((f: any) => ({
            rental_company_id: Number(id),
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
        console.error("PUT fleet insert:", fleetError.message);
        return NextResponse.json(
          { error: fleetError.message },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json(company);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Fleet rows deleted automatically via ON DELETE CASCADE
  const { error } = await supabaseServer
    .from("rental_companies")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
