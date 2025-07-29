import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const categoryId = params.id;

  try {
    // Delete all transactions that belong to this category
    await prisma.transaction.deleteMany({
      where: {
        categoryId,
      },
    });

    // Then delete the category itself
    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return new NextResponse("Failed to delete category", { status: 500 });
  }
}
