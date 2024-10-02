import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, Link, useRouteError, isRouteErrorResponse } from "@remix-run/react";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { DB } = context.cloudflare.env;
  const id = params.id;

  console.log("Fetching subtitle with id:", id);

  if (!id) {
    console.log("Missing ID parameter");
    throw new Response("缺少 ID 参数", { status: 400 });
  }

  const subtitle = await DB.prepare("SELECT * FROM video_subtitles WHERE id = ?")
    .bind(id)
    .first();

  console.log("Fetched subtitle:", subtitle);

  if (!subtitle) {
    console.log("Subtitle not found");
    throw new Response("未找到字幕", { status: 404 });
  }

  // 明确序列化数据
  return json({
    subtitle: {
      id: subtitle.id,
      videoUrl: subtitle.videoUrl,
      subtitleUrl: subtitle.subtitleUrl,
      videoTitle: subtitle.videoTitle,
      subtitleContent: subtitle.subtitleContent
    }
  });
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}

export default function SubtitleDetail() {
  const { subtitle } = useLoaderData<typeof loader>();

  console.log("Rendering subtitle:", subtitle);

  if (!subtitle) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <h1>{subtitle.videoTitle} 的字幕详情</h1>
      <p>ID: {subtitle.id}</p>
      <p>视频 URL: {subtitle.videoUrl}</p>
      <p>字幕 URL: {subtitle.subtitleUrl}</p>
      <h2>字幕内容:</h2>
      <pre>{subtitle.subtitleContent}</pre>
      <Link to="/subtitles">返回字幕列表</Link>
    </div>
  );
}