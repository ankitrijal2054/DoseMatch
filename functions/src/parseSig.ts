import * as functions from "firebase-functions";
import axios from "axios";

interface ParseSigRequest {
  sigText: string;
  daysSupply: number;
}

interface ParseSigResponse {
  amountPerDose: number;
  unit: string;
  frequencyPerDay: number;
  confidence: number;
  rationale: string;
}

const SYSTEM_PROMPT = `You are a pharmacy SIG parser. Extract structured dosing information from prescription SIG text.

Return ONLY valid JSON with this exact structure:
{
  "amountPerDose": <number>,
  "unit": "EA|mL|g|U|actuations",
  "frequencyPerDay": <number>,
  "confidence": <0.0-1.0>,
  "rationale": "<brief explanation>"
}

Rules:
- amountPerDose: numeric quantity per single dose
- unit: canonical unit (EA=each/tablet/cap/patch, mL=milliliter, g=gram, U=insulin units, actuations=puffs)
- frequencyPerDay: how many times per day (QD=1, BID=2, TID=3, QID=4, Q6H=4, etc.)
- confidence: your certainty (0.0-1.0)
- Ignore PRN (as needed) for quantity calculations
- For "as needed" or "prn", assume once daily for quantity purposes
- DO NOT include any text outside the JSON object`;

export const parseSigWithLLM = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"],
  })
  .https.onCall(
    async (data: ParseSigRequest): Promise<ParseSigResponse> => {
      const { sigText } = data;

      console.log(`[SIG LLM] Parsing: "${sigText}"`);

      try {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
          throw new Error("OpenAI API key not configured");
        }

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Parse this SIG: "${sigText}"` },
          ],
          temperature: 0.1,
          max_tokens: 200,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 8000,
        }
      );

      const content = response.data.choices[0].message.content.trim();

      // Strip markdown code blocks if present
      const jsonText = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(jsonText);

      // Validate and clamp
      const result: ParseSigResponse = {
        amountPerDose: Math.max(0.1, parseFloat(parsed.amountPerDose)),
        unit: parsed.unit,
        frequencyPerDay: Math.max(
          1,
          Math.min(24, parseInt(parsed.frequencyPerDay))
        ),
        confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence))),
        rationale: parsed.rationale || "Parsed by AI",
      };

      console.log("[SIG LLM] Success:", result);
      return result;
    } catch (error: any) {
      console.error("[SIG LLM] Error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to parse SIG with LLM",
        error.message
      );
      }
    }
  );
