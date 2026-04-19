import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Image is required." }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mime = image.type || "image/jpeg";

    const result = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Look at this item photo and return valid JSON with these keys only: title, description, category, condition, tags, suggestedPriceMin, suggestedPriceMax. Tags must be an array of short strings. suggestedPriceMin and suggestedPriceMax must be numbers in US dollars appropriate for a college marketplace. suggestedPriceMin must be less than or equal to suggestedPriceMax. Return JSON only.",
            },
            {
              type: "input_image",
              image_url: `data:${mime};base64,${base64}`,
              detail: "auto",
            },
          ],
        },
      ],
    });

    return NextResponse.json({
      text: result.output_text,
    });
  } catch (error) {
    console.error("AI ROUTE ERROR:", error);
    return NextResponse.json({ error: "AI failed" }, { status: 500 });
  }
}

