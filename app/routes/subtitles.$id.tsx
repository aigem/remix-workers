import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";

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

  return json({ subtitle });
}

export default function SubtitleDetail() {
  const { subtitle } = useLoaderData<typeof loader>();

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