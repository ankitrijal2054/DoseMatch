import * as functions from "firebase-functions";
import axios from "axios";

interface ExplainRequest {
  drugQuery: string;
  sigText: string;
  daysSupply: number;
  recommendation: {
    ndc: string;
    packageSize: number;
    unit: string;
    matchType: string;
    status: string;
    overfillPercent: number;
    packsUsed: { ndc: string; count: number }[];
  };
}

const EXPLAINER_PROMPT = `You are a pharmacy expert explaining NDC recommendations to pharmacists.

Given a prescription and the recommended package, generate a clear, concise 1-2 sentence explanation of why this is the optimal choice.

Focus on:
- Match quality (exact, multi-pack, nearest)
- Active vs inactive status
- Overfill/underfill considerations
- Practical dispensing advantages

Be professional but conversational. Do not include any patient identifiable information.`;

export const explainRecommendation = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"],
  })
  .https.onCall(async (data: ExplainRequest): Promise<string> => {
    const { drugQuery, sigText, daysSupply, recommendation } = data;

    console.log(
      `[Explainer] Processing: ${drugQuery} (NDC: ${recommendation.ndc})`
    );

    try {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error("OpenAI API key not configured");
      }

      const context =
        `Prescription: ${drugQuery}, SIG: "${sigText}", ${daysSupply} days

Recommended: NDC ${recommendation.ndc}, ${recommendation.packageSize} ${
          recommendation.unit
        }
Match Type: ${recommendation.matchType}
Status: ${recommendation.status}
Overfill: ${recommendation.overfillPercent.toFixed(1)}%
Packs Used: ${recommendation.packsUsed
          .map((p) => `${p.count}x${p.ndc}`)
          .join(", ")}`.trim();

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: EXPLAINER_PROMPT },
            { role: "user", content: context },
          ],
          temperature: 0.7,
          max_tokens: 150,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      const explanation = response.data.choices[0].message.content.trim();
      console.log("[Explainer] Success:", explanation);
      return explanation;
    } catch (error: any) {
      console.error("[Explainer] Error:", error);
      // Return deterministic fallback
      const fallback = `This ${
        recommendation.matchType === "exact" ? "exact match" : "recommendation"
      } is ${
        recommendation.status === "ACTIVE" ? "active" : "inactive"
      }. Overfill: ${recommendation.overfillPercent.toFixed(1)}%.`;
      console.log("[Explainer] Using fallback:", fallback);
      return fallback;
    }
  });
