import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/aws-s3";
import { processReceipt } from "@/lib/receipt-processor";

export async function POST(request: NextRequest) {
  console.log("API handler invoked");

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    console.log("file:", file);

    if (!file) {
      console.log("No file found");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const s3Key = `receipts/demo-user/${timestamp}-${file.name}`;

    const s3Upload = await uploadToS3(buffer, s3Key, file.type);
    console.log("S3 uploaded");

    const receipt = await prisma.receipt.create({
      data: {
        fileName: `${timestamp}-${file.name}`,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        s3Key,
        s3Url: s3Upload.url,
        userId: "demo-user",
        status: "pending",
      },
    });

    const extractedTransactions = await processReceipt(file, buffer);

    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { status: "processed" },
    });

    return NextResponse.json({ receipt, extractedTransactions });
  } catch (err: any) {
    console.error("Unhandled error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

