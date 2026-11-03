import { env } from "../env";
import { createFakeModel, createOpenAiCompatible, type ChatModel } from "./models";

/** The configured model, or null when the assistant is disabled. */
export const chatModel: ChatModel | null =
  env.ai.provider === "openai"
    ? createOpenAiCompatible({ baseUrl: env.ai.baseUrl, apiKey: env.ai.apiKey, model: env.ai.model, jsonMode: env.ai.jsonMode })
    : env.ai.provider === "fake"
      ? createFakeModel()
      : null;
