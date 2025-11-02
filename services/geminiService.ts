import { GoogleGenAI, Modality } from '@google/genai';
import { fileToGenerativePart } from '../utils/fileUtils';

// As per guidelines, the API key must be obtained from `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface EditImageResult {
  imageUrl: string;
  tokensUsed: number;
}

const parseGeminiError = (error: Error): string => {
    try {
        const jsonStartIndex = error.message.indexOf('{');
        if (jsonStartIndex === -1) {
            return error.message.replace(/\n/g, '<br />'); 
        }
        
        const jsonString = error.message.substring(jsonStartIndex);
        const errorData = JSON.parse(jsonString);
        
        const apiError = errorData.error;

        if (apiError && apiError.code === 429 && apiError.status === 'RESOURCE_EXHAUSTED') {
            const mainMessage = "Meghaladtad a jelenlegi kvótádat. Kérjük, ellenőrizd a csomagodat és a számlázási adataidat.";
            let userMessage = `<p>${mainMessage}</p>`;

            const retryInfo = apiError.details?.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
            if (retryInfo && retryInfo.retryDelay) {
                userMessage += `<p class="mt-1">Kérjük, próbáld újra <strong>${retryInfo.retryDelay}</strong> múlva.</p>`;
            }

            const links = [];
            const helpLink = apiError.details?.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.Help')?.links[0];
            if (helpLink) {
                links.push(`<a href="${helpLink.url}" target="_blank" rel="noopener noreferrer" class="font-bold underline hover:text-red-900">Tudj meg többet a Gemini API kvótákról</a>`);
            }
            
            const usageLinkMatch = apiError.message.match(/https:\/\/ai\.dev\/usage\?tab=rate-limit/);
            if (usageLinkMatch) {
                 links.push(`<a href="${usageLinkMatch[0]}" target="_blank" rel="noopener noreferrer" class="font-bold underline hover:text-red-900">Használat ellenőrzése</a>`);
            }

            if (links.length > 0) {
                userMessage += '<div class="mt-2"><p class="font-semibold">Hasznos linkek:</p><ul class="list-disc list-inside">';
                links.forEach(link => {
                    userMessage += `<li>${link}</li>`;
                });
                userMessage += '</ul></div>';
            }

            return userMessage;
        }

        if (apiError) {
            return `API Hiba (${apiError.code}): ${apiError.message.replace(/\n/g, '<br />')}`;
        }

        return error.message.replace(/\n/g, '<br />');
    } catch (e) {
        // Fallback for parsing errors or other issues
        return error.message.replace(/\n/g, '<br />');
    }
};


export const editImage = async (
  file: File,
  prompt: string
): Promise<EditImageResult> => {
  try {
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
    if (error instanceof Error) {
        throw new Error(parseGeminiError(error));
    }
    throw new Error('Kép generálása sikertelen egy ismeretlen hiba miatt.');
  }
};
