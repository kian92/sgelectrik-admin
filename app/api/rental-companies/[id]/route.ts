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
    .select("*, rental_company_fleet(*, rental_company_faqs(*))")
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

  // 1. Update the company row
  const { data: company, error: companyError } = await supabaseServer
    .from("rental_companies")
    .update({
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
    .eq("id", id)
    .select()
    .single();

  if (companyError) {
    console.error("PUT rental-companies:", companyError.message);
    return NextResponse.json({ error: companyError.message }, { status: 500 });
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
