import { NextRequest, NextResponse } from "next/server";
import {
  uploadToBunny,
  validateFile,
  putRawToBunny,
  getRawFromBunny,
  deleteRawFromBunny,
  type ContentType,
} from "@/app/lib/bunny";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function tempChunkPath(uploadId: string, chunkIndex: number) {
  // uploadId is a client-generated token; scope it to a temp namespace so
  // stray/abandoned chunk uploads can't collide with or overwrite real files.
  const safeId = uploadId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `tmp/uploads/${safeId}/${chunkIndex}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const contentType =
      (formData.get("contentType") as ContentType) || "general";
    if (
      session.user.role === "editor" &&
      contentType !== "blog"
    ) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    const uploadId = formData.get("uploadId") as string | null;

    // Non-chunked (legacy/small-file) path: upload directly.
    if (!uploadId) {
      const validation = validateFile(file.type, file.size);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadToBunny(buffer, file.name, file.type, contentType);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, url: result.url, path: result.path });
    }

    // Chunked upload path — each request carries one chunk.
    const chunkIndex = Number(formData.get("chunkIndex"));
    const totalChunks = Number(formData.get("totalChunks"));
    const fileName = (formData.get("fileName") as string) || file.name;
    const mimeType = (formData.get("mimeType") as string) || file.type;
    const totalSize = Number(formData.get("totalSize") ?? 0);

    if (
      !uploadId ||
      !Number.isInteger(chunkIndex) ||
      !Number.isInteger(totalChunks) ||
      chunkIndex < 0 ||
      totalChunks <= 0 ||
      chunkIndex >= totalChunks
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid chunk metadata" },
        { status: 400 },
      );
    }

    if (totalSize > 0) {
      const validation = validateFile(mimeType, totalSize);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 },
        );
      }
    }

    // Stage this chunk as its own temp object in Bunny storage — stateless
    // across function instances, unlike an in-memory buffer would be.
    const chunkBuffer = Buffer.from(await file.arrayBuffer());
    const staged = await putRawToBunny(tempChunkPath(uploadId, chunkIndex), chunkBuffer);
    if (!staged.success) {
      return NextResponse.json(
        { success: false, error: staged.error ?? "Failed to stage chunk" },
        { status: 500 },
      );
    }

    if (chunkIndex < totalChunks - 1) {
      return NextResponse.json({ success: true, complete: false });
    }

    // Final chunk: download and concatenate all parts, upload the full file,
    // then best-effort clean up the temp parts.
    try {
      const parts = await Promise.all(
        Array.from({ length: totalChunks }, (_, i) => getRawFromBunny(tempChunkPath(uploadId, i))),
      );
      const fullBuffer = Buffer.concat(parts);

      const result = await uploadToBunny(fullBuffer, fileName, mimeType, contentType);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        complete: true,
        url: result.url,
        path: result.path,
      });
    } finally {
      await Promise.all(
        Array.from({ length: totalChunks }, (_, i) => deleteRawFromBunny(tempChunkPath(uploadId, i))),
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Upload error:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}

/**
 * OPTIONS /api/upload
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
