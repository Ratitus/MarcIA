import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `Ets MarcIA, una IA super intel·ligent especialitzada en videojocs i desenvolupament de jocs.
Respon sempre en català.
Sigues concís, directe i al gra. Evita textos enormes i innecessaris.
Si et pregunten sobre com crear un joc o codi, dona respostes pràctiques i directes.
Sempre que generis codi per a un joc web, proporciona un únic bloc de codi HTML que inclogui el CSS i el JS necessaris perquè es pugui previsualitzar directament.
Pots analitzar imatges i llegir fitxers si l'usuari te n'envia com a referència.`;

function getAI() {
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No s\'ha trobat cap clau d\'API. Si us plau, afegeix-la a Configuració (icona de l\'engranatge).');
  }
  return new GoogleGenAI({ apiKey: apiKey as string });
}

export async function* sendChatMessageStream(
  history: any[], 
  message: string, 
  files?: { data: string, mimeType: string, isText: boolean }[],
  signal?: AbortSignal,
  modelName: string = 'gemini-3-flash-preview'
) {
  const ai = getAI();
  const model = modelName;
  
  const parts: any[] = [];
  
  if (files) {
    for (const file of files) {
      if (file.isText) {
        parts.push({ text: `\n--- Contingut del fitxer ---\n${file.data}\n--- Fi del fitxer ---\n` });
      } else {
        parts.push({
          inlineData: {
            data: file.data.split(',')[1],
            mimeType: file.mimeType
          }
        });
      }
    }
  }
  
  if (message) {
    parts.push({ text: message });
  }

  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  if (parts.length > 0) {
    contents.push({
      role: 'user',
      parts: parts
    });
  }

  const responseStream = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    }
  });

  for await (const chunk of responseStream) {
    if (signal?.aborted) {
      break;
    }
    yield chunk.text;
  }
}

export async function translateText(text: string, fromLang: string, toLang: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Tradueix el següent text de ${fromLang} a ${toLang}. Només retorna la traducció directa, sense afegir cap comentari ni text addicional:\n\n${text}`,
  });
  return response.text;
}
