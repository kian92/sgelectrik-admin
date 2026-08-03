// Keep in sync with QuizAnswers / quiz option values in sgelectrik-web's
// app/quiz/page.tsx — the quiz branches into "personal" and "commercial"
// flows, each with their own field set and option values.
//
// Labels are keyed by camelCase (as stored in leads.quiz_answers JSON) with
// snake_case aliases (as stored in the quiz_submissions table columns) so
// the same lookup works for both sources.
export const QUIZ_LABELS: Record<string, string> = {
  vehicleUse: "Vehicle use",
  vehicle_use: "Vehicle use",
  budget: "Budget",
  dailyDistanceKm: "Daily distance",
  daily_distance_km: "Daily distance",
  hasHomeCharging: "Home charging",
  has_home_charging: "Home charging",
  priority: "Priority",
  commercialUse: "Main use",
  commercial_use: "Main use",
  loadRequirement: "Carrying capacity",
  load_requirement: "Carrying capacity",
  // Legacy field from an older quiz version — kept so historical leads
  // still render instead of falling through to the raw key.
  carType: "Car type",
};

export function formatQuizValue(key: string, value: unknown): string {
  if (key === "hasHomeCharging" || key === "has_home_charging")
    return value ? "Yes" : "No";

  if (key === "vehicleUse" || key === "vehicle_use") {
    const map: Record<string, string> = {
      personal: "Personal or family car",
      commercial: "Commercial vehicle",
    };
    return map[String(value)] ?? String(value);
  }

  if (key === "budget") {
    const map: Record<string, string> = {
      under150k: "Under S$150k",
      "150k-200k": "S$150k – S$200k",
      "200k-250k": "S$200k – S$250k",
      above250k: "Above S$250k",
    };
    return map[String(value)] ?? String(value);
  }

  if (key === "dailyDistanceKm" || key === "daily_distance_km") {
    const map: Record<string, string> = {
      under50: "Under 50 km",
      "50-100": "50–100 km",
      "100-150": "100–150 km",
      above150: "Over 150 km",
      "100-200": "100–200 km",
      above200: "Over 200 km",
    };
    return map[String(value)] ?? String(value);
  }

  if (key === "priority") {
    const map: Record<string, string> = {
      saveMoney: "Save money / lowest cost of ownership",
      performance: "Performance and driving excitement",
      techFeatures: "Latest technology and features",
      range: "Maximum range / long journeys",
      cargoSpace: "More cargo space",
      fastCharging: "Faster charging",
    };
    return map[String(value)] ?? String(value);
  }

  if (key === "commercialUse" || key === "commercial_use") {
    const map: Record<string, string> = {
      deliveries: "Deliveries",
      tools: "Carrying tools or equipment",
      goods: "Transporting goods",
      general: "General business use",
    };
    return map[String(value)] ?? String(value);
  }

  if (key === "loadRequirement" || key === "load_requirement") {
    const map: Record<string, string> = {
      light: "Light loads",
      medium: "Medium loads",
      heavy: "Heavy loads",
      notSure: "Not sure",
    };
    return map[String(value)] ?? String(value);
  }

  return String(value);
}
