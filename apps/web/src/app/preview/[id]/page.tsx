import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArticleLayout } from "~/components/article-layout";
import { PreviewBanner } from "~/components/preview-banner";
import type {
  GetPostPreviewByIdQuery,
  GetPostPreviewByIdQueryVariables,
} from "~/lib/graphql/__generated__/graphql";
import { GetPostPreviewByIdDocument } from "~/lib/graphql/__generated__/graphql";
import { authGraphqlClient, graphqlClient } from "~/lib/graphql/client";

async function getPostPreview(id: string) {
  const client = process.env.WORDPRESS_AUTH_TOKEN
    ? authGraphqlClient
    : graphqlClient;

  try {
    const data = await client.request<
      GetPostPreviewByIdQuery,
      GetPostPreviewByIdQueryVariables
    >(GetPostPreviewByIdDocument, { id });
    return data.post;
  } catch (error) {
    console.error("[getPostPreview]", error);
    return null;
  }
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isEnabled } = await draftMode();
  if (!isEnabled) redirect("/");

  const { id } = await params;
  const post = await getPostPreview(id);
  if (!post) notFound();

  return (
    <>
      <PreviewBanner slug={post.slug ?? ""} />
      <ArticleLayout post={post} />
    </>
  );
}
