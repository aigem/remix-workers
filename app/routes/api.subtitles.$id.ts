import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";

// 定义加载器函数，用于处理API请求
export async function loader({ params, context }: LoaderFunctionArgs) {
    // 从上下文中获取数据库连接
    const { DB } = context.cloudflare.env;
    // 从URL参数中获取字幕ID
    const id = params.id;

    // 验证ID是否有效
    if (!id || isNaN(Number(id))) {
        // 如果ID无效，抛出400错误
        throw json({ error: "无效的 ID 参数" }, { status: 400 });
    }

    // 从数据库中查询字幕信息
    const subtitle = await DB.prepare("SELECT * FROM video_subtitles WHERE id = ?")
        .bind(id)
        .first();

    // 如果未找到字幕，抛出404错误
    if (!subtitle) {
        throw json({ error: "未找到字幕" }, { status: 404 });
    }

    // 返回查询到的字幕信息
    return json(subtitle);
}