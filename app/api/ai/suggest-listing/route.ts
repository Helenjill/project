import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  condition: z.string().min(1),
  tags: z.array(z.string()).min(1)
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const image = formData.get('image');

  if (!(image instanceof File)) {
    return NextResponse.json({ error: 'Image is required.' }, { status: 400 });
  }

  const bytes = await image.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const mime = image.type || 'image/jpeg';

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: 'Analyze this item photo and return JSON with title, description, category, condition, and tags (array).'
          },
          {
            type: 'input_image',
            image_url: `data:${mime};base64,${base64}`
            detail: 'auto'
          }
        ]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'listing_suggestion',
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            condition: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          },
          required: ['title', 'description', 'category', 'condition', 'tags'],
          additionalProperties: false
        }
      }
    }
  });

  const parsed = schema.safeParse(JSON.parse(response.output_text || '{}'));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Could not parse model output' }, { status: 422 });
  }

  return NextResponse.json(parsed.data);
}
