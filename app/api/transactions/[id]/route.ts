import { prisma } from "@/lib/prisma"; // adjust import to your setup
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { description, amount, date, merchant } = body;

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        description,
        amount: parseFloat(amount),
        date: new Date(date),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return new NextResponse("Failed to update", { status: 500 });
  }
}
