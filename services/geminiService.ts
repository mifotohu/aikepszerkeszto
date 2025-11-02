import { GoogleGenAI, Modality } from '@google/genai';
import { fileToGenerativePart } from '../utils/fileUtils';

// This function creates a new client instance for each request,
// ensuring the most up-to-date API key from the user is used.
const getAiClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("Nincs API kulcs beállítva. A funkció használatához add meg a Google AI Studio API kulcsodat az 'API Kulcs Beállítva' szekció 'Módosítás' gombjára kattintva.");
  }
  // As per guidelines, create a new GoogleGenAI instance right before making an API call.
  return new GoogleGenAI({ apiKey });
};

export interface EditImageResult {
  imageUrl: string;
  tokensUsed: number;
}

const parseGeminiError = (error: any): string => {
    const errorMessage = (error?.message || String(error)).replace(/\n/g, '<br />');

    // Check specifically for quota errors, which are the most common issue on public apps.
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
        const mainMessage = "Meghaladtad a jelenlegi API kvótádat. Ez általában a ingyenes csomag korlátai miatt fordul elő. Kérjük, ellenőrizd a Google AI Studio beállításaidat, vagy próbálkozz később.";
        let userMessage = `<p>${mainMessage}</p>`;

        const retryMatch = errorMessage.match(/retryDelay":"(\d+s)"/);
        if (retryMatch && retryMatch[1]) {
            userMessage += `<p class="mt-1">Kérjük, próbáld újra <strong>${retryMatch[1].replace('s', ' másodperc')}</strong> múlva.</p>`;
        }
        
        const links = [
            `<a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener noreferrer" class="font-bold underline hover:text-red-900">Tudj meg többet a Gemini API kvótákról</a>`,
            `<a href="https://ai.dev/usage?tab=rate-limit" target="_blank" rel="noopener noreferrer" class="font-bold underline hover:text-red-900">Használat ellenőrzése</a>`
        ];

        userMessage += '<div class="mt-2"><p class="font-semibold">Hasznos linkek:</p><ul class="list-disc list-inside">';
        links.forEach(link => {
            userMessage += `<li>${link}</li>`;
        });
        userMessage += '</ul></div>';

        return userMessage;
    }
    
    if (errorMessage.includes('API key not valid')) {
        return "Érvénytelen API kulcs. Kérjük, ellenőrizd a megadott kulcsot, és győződj meg róla, hogy helyes és aktív.";
    }

    // Fallback for other generic errors
    return errorMessage;
};


export const editImage = async (
  file: File,
  prompt: string,
  apiKey: string,
): Promise<EditImageResult> => {
  try {
    const ai = getAiClient(apiKey);
    const { base64, mimeType } = await fileToGenerativePart(file);

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    // 1. Először ellenőrizzük, hogy a kérést magát blokkolta-e a rendszer.
    if (response.promptFeedback?.blockReason) {
        throw new Error(
            `A generálás sikertelen volt, mert a kérésedet blokkolta a rendszer. ` +
            `Ok: ${response.promptFeedback.blockReason}. ` +
            `${response.promptFeedback.blockReasonMessage || ''}`
        );
    }

    const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;
    const candidate = response.candidates?.[0];

    // 2. Ellenőrizzük, hogy a modell adott-e egyáltalán "jelölt" választ.
    if (!candidate) {
        throw new Error('Az API nem adott vissza érvényes választ. Ez előfordulhat hálózati hiba vagy szerveroldali probléma miatt.');
    }

    // 3. Keressük a képet a válaszban.
    if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            return { imageUrl, tokensUsed };
          }
        }
    }

    // 4. Ha nincs kép, specifikusabb okot keresünk.
    if (candidate.finishReason === 'SAFETY') {
        throw new Error('A generálás sikertelen volt biztonsági okokból. Kérlek, próbálj meg más utasítást adni, vagy használj másik képet.');
    }

    // 5. Ellenőrizzük, hogy az API szöveget adott-e kép helyett.
    const responseText = response.text?.trim();
    if (responseText) {
        throw new Error(`Az API szöveges választ adott a kép helyett: "${responseText}"`);
    }

    // 6. Végső, általános hibaüzenet, ha semmi mást nem találtunk.
    throw new Error('Az API nem generált képet. A válasz nem tartalmazta a várt képadatokat, és nem adott meg konkrét hibaokot.');

  } catch (error) {
    console.error('Hiba a kép szerkesztése közben a Gemini API-val:', error);
    throw new Error(parseGeminiError(error));
  }
};
