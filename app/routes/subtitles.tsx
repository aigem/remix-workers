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

    // 从环境变量中获取 API key
    const API_KEY = context.cloudflare.env.API_KEY as string;

    try {
        let apiKey: string | null = null;
        let data: any;

        if (contentType && contentType.includes("application/json")) {
            data = await request.json();
            apiKey = data.apiKey;
        } else {
            const formData = await request.formData();
            apiKey = formData.get("apiKey") as string | null;
            data = Object.fromEntries(formData);
        }

        // 验证 API key
        if (apiKey !== API_KEY) {
            return json({ success: false, message: "无效的 API key" }, { status: 401 });
        }

        const isApiCall = contentType && contentType.includes("application/json");

        if (data._action === "create") {
            // 处理添加操作
            const { videoId, videoUrl, subtitleUrl, videoTitle, subtitleContent } = data;
            const result = await DB.prepare(
                "INSERT INTO video_subtitles (videoId, videoUrl, subtitleUrl, videoTitle, subtitleContent) VALUES (?, ?, ?, ?, ?)"
            )
                .bind(videoId, videoUrl, subtitleUrl, videoTitle, subtitleContent)
                .run();

            if (result.success) {
                const response = {
                    success: true,
                    message: "记录已成功添加",
                    newId: result.meta?.last_row_id,
                    videoId: videoId,
                    videoUrl: videoUrl
                };
                return isApiCall ? json(response) : response;
            } else {
                throw new Error("添加操作失败");
            }
        } else if (data._action === "delete") {
            // 处理删除操作
            const result = await DB.prepare("DELETE FROM video_subtitles WHERE id = ?")
                .bind(data.id)
                .run();

            if (result.success) {
                const response = {
                    success: true,
                    message: "记录已成功删除",
                    deletedId: data.id
                };
                return isApiCall ? json(response) : response;
            } else {
                throw new Error("删除操作失败");
            }
        }
    } catch (error) {
        console.error("Action error:", error);
        return json({ success: false, message: "操作失败", error: (error as Error).message }, { status: 500 });
    }

    return json({ success: false, message: "未知操作" }, { status: 400 });
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
                <input type="text" name="apiKey" placeholder="API Key" required />
                <input type="text" name="videoId" placeholder="视频 ID" required />
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
                        <Link to={`/show/subtitles/${subtitle.id}`}>
                            {subtitle.videoTitle}
                        </Link>
                        <Form method="post" style={{ display: 'inline' }}>
                            <input type="hidden" name="_action" value="delete" />
                            <input type="hidden" name="id" value={subtitle.id} />
                            <input type="hidden" name="apiKey" value="" /> {/* 这里需要客户端提供 API key */}
                            <button type="submit">删除</button>
                        </Form>
                    </li>
                ))}
            </ul>

            {actionData?.success && <p>{actionData.message || "操作成功!"}</p>}
            {!actionData?.success && actionData?.message && <p style={{ color: 'red' }}>{actionData.message}</p>}
        </div>
    );
}