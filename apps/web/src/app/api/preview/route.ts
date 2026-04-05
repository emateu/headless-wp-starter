import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const secret = searchParams.get("secret");
  const id = searchParams.get("id");

  if (!secret || secret !== process.env.PREVIEW_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ message: "Missing post ID" }, { status: 400 });
  }

  const draft = await draftMode();
  draft.enable();

  redirect(`/preview/${id}`);
}
