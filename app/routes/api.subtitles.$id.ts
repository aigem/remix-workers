import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ params, context }: LoaderFunctionArgs) {
    const { DB } = context.cloudflare.env;
    const id = params.id;

    if (!id || isNaN(Number(id))) {
        throw json({ error: "无效的 ID 参数" }, { status: 400 });
    }

    const subtitle = await DB.prepare("SELECT * FROM video_subtitles WHERE id = ?")
        .bind(id)
        .first();

    if (!subtitle) {
        throw json({ error: "未找到字幕" }, { status: 404 });
    }

    return json(subtitle);
}