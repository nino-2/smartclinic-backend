// Simple heuristic first (fast)
const HEALTH_KEYWORDS = [
  "symptom",
  "symptoms",
  "fever",
  "cough",
  "headache",
  "pain",
  "medication",
  "drug",
  "dose",
  "dosage",
  "side effect",
  "side effects",
  "clinic",
  "appointment",
  "health",
  "nutrition",
  "diet",
  "exercise",
  "mental health",
  "therapy",
  "depression",
  "anxiety",
  "injury",
  "first aid",
  "infection",
  "diabetes",
  "hypertension",
  "cold",
  "flu",
  "pregnancy",
  "period",
  "menstrual",
  "allergy",
  "asthma",
];

exports.quickHeuristic = (text = "") => {
  const t = text.toLowerCase();
  return HEALTH_KEYWORDS.some((k) => t.includes(k));
};
