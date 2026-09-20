import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text, from = "tr", to = "en" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Google Translate public endpoint
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      from
    )}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Translation service returned status ${res.status}`);
    }

    const data = await res.json();
    // data[0] contains array of [[translatedChunk, originalChunk], ...]
    let translatedText = "";
    if (Array.isArray(data) && Array.isArray(data[0])) {
      translatedText = data[0].map((item: any) => item[0]).join("");
    } else {
      throw new Error("Unexpected translation response format");
    }

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to translate text" },
      { status: 500 }
    );
  }
}
