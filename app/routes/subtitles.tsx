import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, Form, useActionData } from "@remix-run/react";

export async function loader({ context }: LoaderFunctionArgs) {
  const { DB } = context.cloudflare.env;
  const subtitles = await DB.prepare("SELECT * FROM video_subtitles").all();
  return json({ subtitles: subtitles.results });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { DB } = context.cloudflare.env;
  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "create":
      const videoUrl = formData.get("videoUrl") as string;
      const subtitleUrl = formData.get("subtitleUrl") as string;
      const videoTitle = formData.get("videoTitle") as string;
      const subtitleContent = formData.get("subtitleContent") as string;

      await DB.prepare(
        "INSERT INTO video_subtitles (videoUrl, subtitleUrl, videoTitle, subtitleContent) VALUES (?, ?, ?, ?)"
      ).bind(videoUrl, subtitleUrl, videoTitle, subtitleContent).run();
      break;

    case "delete":
      const id = formData.get("id") as string;
      await DB.prepare("DELETE FROM video_subtitles WHERE id = ?").bind(id).run();
      break;

    // 可以根据需要添加更新操作
  }

  return json({ success: true });
}

export default function Subtitles() {
  const { subtitles } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div>
      <h1>字幕管理</h1>

      <h2>添加新字幕</h2>
      <Form method="post">
        <input type="hidden" name="_action" value="create" />
        <input type="text" name="videoUrl" placeholder="视频 URL" required />
        <input type="text" name="subtitleUrl" placeholder="字幕 URL" required />
        <input type="text" name="videoTitle" placeholder="视频标题" required />
        <textarea name="subtitleContent" placeholder="字幕内容"></textarea>
        <button type="submit">添加</button>
      </Form>

      <h2>字幕列表</h2>
      <ul>
        {subtitles.map((subtitle: any) => (
          <li key={subtitle.id}>
            {subtitle.videoTitle}
            <Form method="post" style={{ display: 'inline' }}>
              <input type="hidden" name="_action" value="delete" />
              <input type="hidden" name="id" value={subtitle.id} />
              <button type="submit">删除</button>
            </Form>
          </li>
        ))}
      </ul>

      {actionData?.success && <p>操作成功!</p>}
    </div>
  );
}