import Groq from 'groq-sdk';

import { requireRole } from '@/lib/auth';
import {
  ALL_CATEGORIES,
  COLORS,
  OCCASIONS,
  FABRICS,
  type Category,
  type Color,
  type Occasion,
  type Fabric,
} from '@/lib/constants';

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const AUTO_FILL_PROMPT = `You are a fashion inventory assistant for an Indian wedding boutique.
Analyse this dress image and extract structured details.
Return ONLY valid JSON with exactly this structure (no extra keys, no explanation):
{
  "name": "descriptive dress title (string)",
  "gender": "men" | "women",
  "category": one of [${ALL_CATEGORIES.join(', ')}],
  "colors": ["color1"] using ONLY: ${COLORS.join(', ')},
  "occasions": array from [${OCCASIONS.join(', ')}],
  "fabric": one of [${FABRICS.join(', ')}],
  "tags": ["descriptive keyword"] (max 5),
  "suggestedPrice": number (in INR) or null
}`;

export interface InventoryAutoFill {
  name: string;
  gender: 'men' | 'women' | null;
  category: Category | null;
  colors: Color[];
  occasions: Occasion[];
  fabric: Fabric | null;
  tags: string[];
  suggestedPrice: number | null;
}

function sanitise(raw: Record<string, unknown>): InventoryAutoFill {
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
  return {
    name: typeof raw.name === 'string' ? raw.name : '',
    gender: raw.gender === 'men' || raw.gender === 'women' ? raw.gender : null,
    category: (ALL_CATEGORIES as readonly string[]).includes(raw.category as string)
      ? (raw.category as Category)
      : null,
    colors: arr(raw.colors).filter((c) => (COLORS as readonly string[]).includes(c)) as Color[],
    occasions: arr(raw.occasions).filter((o) => (OCCASIONS as readonly string[]).includes(o)) as Occasion[],
    fabric: (FABRICS as readonly string[]).includes(raw.fabric as string) ? (raw.fabric as Fabric) : null,
    tags: arr(raw.tags).slice(0, 5),
    suggestedPrice:
      typeof raw.suggestedPrice === 'number' && raw.suggestedPrice > 0 ? raw.suggestedPrice : null,
  };
}

async function callGroq(imageBase64: string) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  return groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: AUTO_FILL_PROMPT },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 512,
  });
}

export async function POST(req: Request) {
  try {
    await requireRole(['owner']);
    const { imageBase64 } = await req.json();
    if (typeof imageBase64 !== 'string' || !imageBase64) {
      return Response.json({ ok: false, error: 'No image provided.' }, { status: 400 });
    }

    let completion;
    try {
      completion = await callGroq(imageBase64);
    } catch {
      // one retry on network/5xx
      completion = await callGroq(imageBase64);
    }

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty Groq response');
    const data = sanitise(JSON.parse(content));
    return Response.json({ ok: true, data });
  } catch (error) {
    console.error('[autofill] Groq call failed:', error);
    return Response.json(
      { ok: false, error: "Couldn't read this image. Fill in manually." },
      { status: 500 },
    );
  }
}
