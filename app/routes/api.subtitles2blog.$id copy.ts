import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";

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
        .first();

    // 如果未找到字幕，返回 404 错误
    if (!subtitle) {
        throw json({ error: "未找到字幕" }, { status: 404 });
    }

    // 提取字幕信息
    const sub_id = subtitle.id;
    const sub_videoUrl = subtitle.videoUrl;
    const sub_subtitleUrl = subtitle.subtitleUrl;
    const sub_videoTitle = subtitle.videoTitle;
    const sub_subtitleContent = subtitle.subtitleContent;

    // 使用 OpenAI API 将字幕内容转换为博客内容
    const blogContent = await convertSubtitleToBlog(sub_subtitleContent, context);

    // 返回处理后的各信息
    return json({
        id: sub_id,
        videoUrl: sub_videoUrl,
        subtitleUrl: sub_subtitleUrl,
        videoTitle: sub_videoTitle,
        blogContent: blogContent,
    });
}

// 使用 OpenAI API 将字幕内容转换为博客内容的函数
async function convertSubtitleToBlog(
    subtitleContent: string,
    context: LoaderFunctionArgs["context"]
): Promise<string> {
    const OPENAI_API_KEY = context.OPENAI_API_KEY;
    const apiUrl = "https://api.openai.com/v1/completions";

    // 构建提示(prompt)
    const prompt = `请将以下字幕内容转换为一篇详细的博客文章：\n\n字幕内容：\n${subtitleContent}\n\n要求：\n- 博客需包含引言、主体和结论。\n- 使用专业且易于理解的语言。\n- 添加适当的标题和小标题。\n- 保持内容连贯和有条理。`;

    // 准备请求体
    const requestBody = {
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 1,
    };

    // 发起请求到 OpenAI API
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // 处理响应
    if (response.ok) {
        return data.choices[0].text.trim();
    } else {
        console.error("OpenAI API Error:", data);
        throw json({ error: "生成博客内容失败" }, { status: 500 });
    }
}