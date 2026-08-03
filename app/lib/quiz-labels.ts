// Keep in sync with QuizAnswers / quiz option values in sgelectrik-web's
// app/quiz/page.tsx — the quiz branches into "personal" and "commercial"
// flows, each with their own field set and option values.
export const QUIZ_LABELS: Record<string, string> = {
  vehicleUse: "Vehicle use",
  budget: "Budget",
  dailyDistanceKm: "Daily distance",
  hasHomeCharging: "Home charging",
  priority: "Priority",
  commercialUse: "Main use",
  loadRequirement: "Carrying capacity",
  // Legacy field from an older quiz version — kept so historical leads
  // still render instead of falling through to the raw key.
  carType: "Car type",
};

export function formatQuizValue(key: string, value: unknown): string {
  if (key === "hasHomeCharging") return value ? "Yes" : "No";

  if (key === "vehicleUse") {
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

  if (key === "dailyDistanceKm") {
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

  if (key === "commercialUse") {
    const map: Record<string, string> = {
      deliveries: "Deliveries",
      tools: "Carrying tools or equipment",
      goods: "Transporting goods",
      general: "General business use",
    };
    return map[String(value)] ?? String(value);
  }

  if (key === "loadRequirement") {
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
