import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.config";
import { HttpStatusCode, ResponseMessage } from "../enums";
import { AppError } from "../utils/app-error.util";
import logger from "../config/logger.config";

const SYSTEM_PROMPT = `You are a helpful hospital assistant for Smart HMS.
You help hospital staff (doctors and front-desk officers) with general questions
about hospital departments, specialties, working hours, and general medical or
administrative guidance.

Rules:
- You do not have access to patient records, appointments, or case data.
- If asked for patient or appointment information, say you cannot access it and
  suggest checking the relevant dashboard page.
- Do not provide specific medical diagnoses. Give general information only and
  recommend consulting a qualified doctor for individual cases.
- Do not ask for, repeat, or store patient-identifying information.
- For emergencies, advise contacting local emergency services immediately.
- Keep answers concise and professional.`;

export class ChatService {
  async getResponse(message: string): Promise<string> {
    if (!env.GEMINI_API_KEY) {
      throw new AppError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ResponseMessage.CHAT_SERVICE_UNAVAILABLE,
      );
    }

    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
        systemInstruction: SYSTEM_PROMPT,
      });
      const result = await model.generateContent(message);
      const reply = result.response.text().trim();

      if (!reply) {
        throw new Error("Gemini returned an empty response");
      }

      return reply;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      const details = error instanceof Error ? error.message : String(error);
      logger.error(`Gemini request failed: ${details}`);

      throw new AppError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ResponseMessage.CHAT_SERVICE_UNAVAILABLE,
      );
    }
  }
}
