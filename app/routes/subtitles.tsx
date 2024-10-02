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

    try {
        if (contentType && contentType.includes("application/json")) {
            const data = await request.json();
            
            if (data._action === "delete") {
                // 处理删除操作
                const result = await DB.prepare("DELETE FROM video_subtitles WHERE id = ?")
                    .bind(data.id)
                    .run();

                if (result.success) {
                    return json({
                        success: true,
                        message: "记录已成功删除",
                        deletedId: data.id
                    });
                } else {
                    throw new Error("删除操作失败");
                }
            } else {
                // ... 保持现有的添加逻辑 ...
            }
        } else {
            // 处理表单数据
            const formData = await request.formData();
            const action = formData.get("_action");

            if (action === "delete") {
                const id = formData.get("id") as string;
                const result = await DB.prepare("DELETE FROM video_subtitles WHERE id = ?")
                    .bind(id)
                    .run();

                if (result.success) {
                    return json({
                        success: true,
                        message: "记录已成功删除",
                        deletedId: id
                    });
                } else {
                    throw new Error("删除操作失败");
                }
            }
            // ... 保持其他表单处理逻辑不变 ...
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
                        <Link to={`/subtitles/${subtitle.id}`}>
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