import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, Form, useActionData, Link } from "@remix-run/react";

export async function loader({ context }: LoaderFunctionArgs) {
    const { DB } = context.cloudflare.env;
    const subtitles = await DB.prepare("SELECT * FROM video_subtitles").all();
    return json({ subtitles: subtitles.results });
}

export async function action({ request, context }: ActionFunctionArgs) {
    const { DB } = context.cloudflare.env;
    const contentType = request.headers.get("Content-Type");

    if (contentType && contentType.includes("application/json")) {
        // 处理 JSON 数据
        const { videoUrl, subtitleUrl, videoTitle, subtitleContent } = await request.json();
        
        await DB.prepare(
            "INSERT INTO video_subtitles (videoUrl, subtitleUrl, videoTitle, subtitleContent) VALUES (?, ?, ?, ?)"
        ).bind(videoUrl, subtitleUrl, videoTitle, subtitleContent).run();

        return json({ success: true, message: "数据已成功添加" });
    } else {
        // 处理表单数据
        const formData = await request.formData();
        const action = formData.get("_action");

        switch (action) {
            case "create":
                // ... 保留现有的创建逻辑 ...
                break;
            case "delete":
                // ... 保留现有的删除逻辑 ...
                break;
        }
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

            <h2>字幕列表：</h2>
            <ul>
                {subtitles.map((subtitle: any) => (
                    <li key={subtitle.id}>
                        <Link to={`/subtitles/${encodeURIComponent(subtitle.videoTitle)}`}>
                            {subtitle.videoTitle}
                        </Link>
                        <Form method="post" style={{ display: 'inline' }}>
                            <input type="hidden" name="_action" value="delete" />
                            <input type="hidden" name="id" value={subtitle.id} />
                            <button type="submit">删除 确定？</button>
                        </Form>
                    </li>
                ))}
            </ul>

            {actionData?.success && <p>{actionData.message || "操作成功!"}</p>}
        </div>
    );
}