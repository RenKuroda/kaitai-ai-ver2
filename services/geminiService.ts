const rawKey = import.meta.env.VITE_GEMINI_API_KEY;
console.log("✅ APIキー:", rawKey);

import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { GeminiImagePart, GeminiTextPart } from "../types";

// rawKey を使ってAPIキーを返す関数
const getApiKey = (): string => {
  if (!rawKey) {
    console.warn("API_KEY environment variable is not set.");
    return "DUMMY_API_KEY_FOR_UI_TESTING_ONLY";
  }
  return rawKey;
};

// ✅ ここ1回だけでOK！
const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const generateDemolitionEstimate = async (
  prompt: string,
  imageParts: GeminiImagePart[]
): Promise<string> => {
  try {
    const textPart: GeminiTextPart = { text: prompt };
    const contents: Part[] = [textPart, ...imageParts];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: contents },
    });

    const resultText = response.text;
    if (typeof resultText !== 'string') {
      console.error("Gemini API response.text is not a string:", response);
      throw new Error("AIからの応答形式が正しくありません。テキストデータが見つかりませんでした。");
    }

    return resultText;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key not valid")) {
        throw new Error("APIキーが無効です。正しいAPIキーを設定してください。");
      }
      throw new Error(`Gemini APIとの通信に失敗しました: ${error.message}`);
    }
    throw new Error("Gemini APIとの通信中に不明なエラーが発生しました。");
  }
};
