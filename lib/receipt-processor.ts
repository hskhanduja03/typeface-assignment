import vision from "@google-cloud/vision";
import { ExtractedTransaction } from "@/app/upload/page";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const client = new vision.ImageAnnotatorClient({
  keyFilename: "./secrets/gcloud-key.json",
});

// Smart PDF text extraction that avoids compressed streams
function extractReadableTextFromPdf(buffer: Buffer, fileName: string): string {
  try {

    const pdfString = buffer.toString("latin1");
    // Look for uncompressed text (text that appears directly in PDF without stream compression)
    const directTextPatterns = [
      // Text between parentheses that's not in a compressed stream
      /(?:^|[^<])\(([^)]{3,50})\)(?:[^>]|$)/gm,
      // Text after standard PDF text operators, but not in streams
      /(?:Tj|TJ|Td|TD)\s*\(([^)]{3,50})\)/g,
      // Direct text content
      /[A-Za-z][A-Za-z0-9\s.,:-]{20,100}(?=\s|$)/g,
    ];

    let extractedTexts: string[] = [];

    // Only look at parts of PDF that are NOT compressed streams
    const nonStreamParts = pdfString.split(/stream[\s\S]*?endstream/g);
    const cleanPdf = nonStreamParts.join(" ");

    for (const pattern of directTextPatterns) {
      const matches = cleanPdf.match(pattern) || [];
      extractedTexts.push(...matches);
    }

    const cleanTexts = extractedTexts
      .map((text) => text.replace(/[()]/g, "").trim())
      .filter((text) => {
        return (
          text.length > 3 &&
          text.match(/[a-zA-Z]/g) &&
          !text.match(/^[^a-zA-Z]*$/) &&
          !text.includes("<") &&
          !text.includes("stream")
        );
      })
      .slice(0, 20); 

    if (cleanTexts.length > 0) {
      const result = cleanTexts.join(" ").substring(0, 1000);
      return result;
    }

    throw new Error("No readable text found");
  } catch (error) {
    throw error;
  }
}

export async function extractTextFromFile(
  file: File,
  buffer: Buffer
): Promise<string> {
  const mimeType = file.type;

  // 1. If it's a PDF, try Google Vision first (supports both scanned and digital PDFs)
  if (mimeType === "application/pdf") {
    try {
      const uint8Array = new Uint8Array(buffer);

      const [result] = await client.documentTextDetection({
        image: { content: uint8Array },
      });

      const text = result.fullTextAnnotation?.text?.trim();
      if (text && text.length > 0) {
        return text;
      }
    } catch (error) {
      console.error("Google Vision PDF extraction failed:", error);
    }

    // 2. Fallback: Attempt to extract uncompressed plain text manually
    try {
      const pdfString = buffer.toString("latin1");
      const nonStreamParts = pdfString
        .split(/stream[\s\S]*?endstream/g)
        .join(" ");

      const matches = nonStreamParts.match(/[^\x00-\x1F\x7F-\x9F]{5,}/g); // Basic readable text
      const text = matches?.join(" ").replace(/\s+/g, " ").trim();

      if (text && text.length > 0) {
        return text;
      }
    } catch (error) {
      console.error("Raw PDF text extraction failed:", error);
    }

    return "";
  }

  // 3. Image file: Use Vision OCR
  try {
    const uint8Array = new Uint8Array(buffer);
    const [result] = await client.textDetection({
      image: { content: uint8Array },
    });

    const text = result.textAnnotations?.[0]?.description?.trim();
    return text || "";
  } catch (error) {
    console.error("Image OCR failed:", error);
    return "";
  }
}

export async function extractTransactionFromText(
  text: string
): Promise<ExtractedTransaction[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }


  const prompt = `
Extract transaction information from this invoice/receipt text.

Text: "${text}"

Find the main transaction details:
- Total payable amount (look for "Amount Payable", "Total", final amount)
- Transaction/invoice date
- Company/merchant name  
- Service description

Return ONLY a JSON array:
[{"amount": <number>, "description": "<service>", "date": "YYYY-MM-DD", "merchant": "<company>"}]
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();


    // Extract JSON from response
    responseText = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "");
    const jsonStart = responseText.indexOf("[");
    const jsonEnd = responseText.lastIndexOf("]") + 1;

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const jsonString = responseText.slice(jsonStart, jsonEnd);
      const parsed: ExtractedTransaction[] = JSON.parse(jsonString);

      // Validate and clean the parsed data
      const validTransactions = parsed.filter(
        (t) =>
          t.amount !== null &&
          t.amount !== undefined &&
          t.amount > 0 &&
          t.description &&
          t.merchant
      );

      if (validTransactions.length > 0) {
        return validTransactions;
      }
    }

    throw new Error("No valid transactions found in Gemini response");
  } catch (error) {
    console.error(" Gemini failed:", error);
    console.log("Using intelligent fallback...");

    return createFallbackTransaction(text);
  }
}

// Smart fallback that recognizes common invoice patterns
function createFallbackTransaction(text: string): ExtractedTransaction[] {

  // Generic amount extraction
  const amountPatterns = [
    /amount payable[\s:]*(?:rs\.?)?[\s]*(\d+(?:\.\d{2})?)/i,
    /total[\s:]*(?:rs\.?)?[\s]*(\d+(?:\.\d{2})?)/i,
    /(?:rs\.?|₹)[\s]*(\d+(?:\.\d{2})?)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amount = parseFloat(match[1]);
      if (amount > 0) {
        console.log(` Found amount: ${amount}`);

        return [
          {
            amount,
            description: "Transaction",
            date: new Date().toISOString().split("T")[0],
            merchant: "Unknown Merchant",
          },
        ];
      }
    }
  }

  console.log(" Could not extract transaction details");
  return [];
}

export async function processReceipt(
  file: File,
  buffer: Buffer
): Promise<ExtractedTransaction[]> {

  const text = await extractTextFromFile(file, buffer);

  if (!text || text.trim().length === 0) {
    console.error("No text extracted");
    return [];
  }


  const transactions = await extractTransactionFromText(text);

  transactions.forEach((t, i) => {
    console.log(
      `${i + 1}. ${t.merchant}: ₹${t.amount} - ${t.description} (${t.date})`
    );
  });

  return transactions;
}
