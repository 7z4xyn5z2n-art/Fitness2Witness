import { invokeLLM } from "./_core/llm.js";
import type { BodyMetric } from "../drizzle/schema";

/**
 * Extract body metrics from workout text using AI
 * Returns structured data that can be saved to bodyMetrics table
 */
export async function extractBodyMetricsFromText(
  workoutText: string,
): Promise<Partial<BodyMetric> | null> {
  try {
    const prompt = `Extract body metrics from this workout log. Return ONLY a JSON object with these fields (use null if not mentioned):
{
  "weight": number | null,  // in pounds
  "bodyFatPercent": number | null,  // percentage (e.g., 18.5 for 18.5%)
  "muscleMass": number | null,  // in pounds
  "visceralFat": number | null,  // integer rating
  "bmr": number | null,  // basal metabolic rate in calories
  "notes": string | null  // any relevant observations
}

Workout log:
${workoutText}`;

    const result = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      responseFormat: { type: "json_object" },
      maxTokens: 500,
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      // Filter out null values
      const filtered: Partial<BodyMetric> = {};
      if (parsed.weight !== null) filtered.weight = parsed.weight;
      if (parsed.bodyFatPercent !== null) filtered.bodyFatPercent = parsed.bodyFatPercent;
      if (parsed.muscleMass !== null) filtered.muscleMass = parsed.muscleMass;
      if (parsed.visceralFat !== null) filtered.visceralFat = parsed.visceralFat;
      if (parsed.bmr !== null) filtered.bmr = parsed.bmr;
      if (parsed.notes) filtered.notes = parsed.notes;

      return Object.keys(filtered).length > 0 ? filtered : null;
    }

    return null;
  } catch (error) {
    console.warn("[AI Metrics] Failed to extract metrics:", error);
    return null;
  }
}

/**
 * Generate insights based on body metrics history
 * Analyzes trends and provides actionable recommendations
 */
export async function generateMetricsInsights(metrics: BodyMetric[]): Promise<string> {
  if (metrics.length === 0) {
    return "No body metrics data available yet. Start tracking your measurements to see insights!";
  }

  try {
    const metricsData = metrics.map((m) => ({
      date: m.date.toISOString().split("T")[0],
      weight: m.weight,
      bodyFatPercent: m.bodyFatPercent,
      muscleMass: m.muscleMass,
      visceralFat: m.visceralFat,
      bmr: m.bmr,
    }));

    const prompt = `Analyze this body metrics history and provide 3-4 concise insights and recommendations.
Focus on trends, progress, and actionable advice.

Metrics (most recent first):
${JSON.stringify(metricsData, null, 2)}

Provide insights in a friendly, encouraging tone. Be specific with numbers when relevant.`;

    const result = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 800,
    });

    const content = result.choices[0]?.message?.content;
    return typeof content === "string" ? content : "Unable to generate insights at this time.";
  } catch (error) {
    console.warn("[AI Metrics] Failed to generate insights:", error);
    return "Unable to generate insights at this time. Please try again later.";
  }
}

/**
 * Generate personalized goal recommendations based on current metrics
 * Helps users set realistic, achievable targets
 */
export async function generateGoalRecommendations(
  currentMetrics: BodyMetric,
  allMetrics: BodyMetric[],
): Promise<{
  weightGoal?: number;
  bodyFatGoal?: number;
  muscleMassGoal?: number;
  timeframe: string;
  reasoning: string;
}> {
  try {
    const metricsHistory = allMetrics.slice(0, 10).map((m) => ({
      date: m.date.toISOString().split("T")[0],
      weight: m.weight,
      bodyFatPercent: m.bodyFatPercent,
      muscleMass: m.muscleMass,
    }));

    const prompt = `Based on this person's current body metrics and history, recommend realistic goals for the next 8-12 weeks.

Current metrics:
- Weight: ${currentMetrics.weight} lbs
- Body Fat: ${currentMetrics.bodyFatPercent}%
- Muscle Mass: ${currentMetrics.muscleMass} lbs
- Visceral Fat: ${currentMetrics.visceralFat}
- BMR: ${currentMetrics.bmr} cal/day

Recent history (last 10 entries):
${JSON.stringify(metricsHistory, null, 2)}

Return ONLY a JSON object:
{
  "weightGoal": number | null,  // target weight in lbs
  "bodyFatGoal": number | null,  // target body fat %
  "muscleMassGoal": number | null,  // target muscle mass in lbs
  "timeframe": string,  // e.g., "8 weeks" or "12 weeks"
  "reasoning": string  // 2-3 sentences explaining why these goals are appropriate
}

Make goals challenging but achievable. Consider healthy rates of change (1-2 lbs/week for weight loss, etc.).`;

    const result = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      responseFormat: { type: "json_object" },
      maxTokens: 600,
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      return {
        weightGoal: parsed.weightGoal,
        bodyFatGoal: parsed.bodyFatGoal,
        muscleMassGoal: parsed.muscleMassGoal,
        timeframe: parsed.timeframe || "8-12 weeks",
        reasoning: parsed.reasoning || "Goals based on your current metrics and healthy progress rates.",
      };
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.warn("[AI Metrics] Failed to generate goal recommendations:", error);
    return {
      timeframe: "8-12 weeks",
      reasoning:
        "Unable to generate personalized goals at this time. Consult with a fitness professional for guidance.",
    };
  }
}
