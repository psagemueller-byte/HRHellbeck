import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const articles = await prisma.newsArticle.findMany({
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      articles: articles.map((a) => ({
        ...a,
        publishedAt: a.publishedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Fetch news error:", error);
    return NextResponse.json({ success: false, error: "Fehler." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Nicht authentifiziert." }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { title, excerpt, content, author, category, imageUrl } = body;
      const article = await prisma.newsArticle.create({
        data: { title, excerpt, content, author, authorId: session.user.id, category, imageUrl, likes: [] },
      });
      return NextResponse.json({ success: true, article: { ...article, publishedAt: article.publishedAt.toISOString() } });
    }

    if (action === "update") {
      const { id, title, excerpt, content, category, imageUrl } = body;
      const data: Record<string, string> = {};
      if (title !== undefined) data.title = title;
      if (excerpt !== undefined) data.excerpt = excerpt;
      if (content !== undefined) data.content = content;
      if (category !== undefined) data.category = category;
      if (imageUrl !== undefined) data.imageUrl = imageUrl;
      const updated = await prisma.newsArticle.update({ where: { id }, data });
      return NextResponse.json({ success: true, article: { ...updated, publishedAt: updated.publishedAt.toISOString() } });
    }

    if (action === "delete") {
      const { id } = body;
      await prisma.newsArticle.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (action === "toggle-like") {
      const { id } = body;
      const article = await prisma.newsArticle.findUnique({ where: { id } });
      if (!article) return NextResponse.json({ success: false, error: "Nicht gefunden." }, { status: 404 });

      const likes = article.likes.includes(session.user.id)
        ? article.likes.filter((l) => l !== session.user.id)
        : [...article.likes, session.user.id];

      const updated = await prisma.newsArticle.update({ where: { id }, data: { likes } });
      return NextResponse.json({ success: true, article: { ...updated, publishedAt: updated.publishedAt.toISOString() } });
    }

    return NextResponse.json({ success: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    console.error("News action error:", error);
    return NextResponse.json({ success: false, error: "Fehler." }, { status: 500 });
  }
}
