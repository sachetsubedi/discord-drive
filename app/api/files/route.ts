import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, originalName, fileSize, mimeType, discordUrl } = body;

    // If there are any existing records with the same discordUrl,
    // mark them as deleted (soft delete) so the new record becomes the
    // canonical/latest record for this URL.
    try {
      await prisma.uploadedFile.updateMany({
        where: {
          discordUrl,
          deleted: false,
        },
        data: {
          deleted: true,
          updatedAt: new Date(),
        },
      });
    } catch (err) {
      // Non-fatal: log and continue to create the new record
      console.error(
        "Error soft-deleting duplicate files for URL",
        discordUrl,
        err
      );
    }

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        filename,
        originalName,
        fileSize: BigInt(fileSize),
        mimeType,
        discordUrl,
      },
    });

    // Convert BigInt to string for JSON serialization
    const response = {
      ...uploadedFile,
      fileSize: uploadedFile.fileSize.toString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error saving file data:", error);
    return NextResponse.json(
      { error: "Failed to save file data" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const files = await prisma.uploadedFile.findMany({
      where: {
        deleted: false, // Only show non-deleted files
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    // Convert BigInt to string for JSON serialization
    const response = files.map((file) => ({
      ...file,
      fileSize: file.fileSize.toString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Soft delete: mark as deleted instead of removing from database
    await prisma.uploadedFile.update({
      where: { id },
      data: {
        deleted: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "File marked as deleted",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
