import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

// 定义字幕数据的类型
type Subtitle = {
    id: number;
    videoUrl: string;
    subtitleUrl: string;
    videoTitle: string;
    subtitleContent: string;
};

// 定义加载器函数，用于处理 API 请求
export async function loader({ params, context }: LoaderFunctionArgs) {
    // 从上下文中获取数据库连接
    const { DB } = context.cloudflare.env;
    // 从 URL 参数中获取字幕 ID
    const id = params.id;

    // 验证 ID 是否有效
    if (!id || isNaN(Number(id))) {
        // 如果 ID 无效，抛出 400 错误
        throw json({ error: "无效的 ID 参数" }, { status: 400 });
    }

    // 从数据库中查询字幕信息
    const subtitle = await DB.prepare("SELECT * FROM video_subtitles WHERE id = ?")
        .bind(id)
        .first<Subtitle>();

    // 如果未找到字幕，返回 404 错误
    if (!subtitle) {
        throw json({ error: "未找到字幕" }, { status: 404 });
    }

    // 返回字幕信息
    return json({ subtitle });
}

// React 组件，展示相关信息
export default function SubtitlePage() {
    const { subtitle } = useLoaderData<typeof loader>();

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
            <h1>{subtitle.videoTitle}</h1>
            <p>
                <strong>字幕 ID：</strong> {subtitle.id}
            </p>
            <p>
                <strong>视频链接：</strong> {subtitle.videoUrl}
            </p>
            <p>
                <strong>字幕链接：</strong> {subtitle.subtitleUrl}
            </p>
            <p>
                <strong>字幕内容：</strong>
                <pre>{subtitle.subtitleContent}</pre>
            </p>
        </div>
    );
}