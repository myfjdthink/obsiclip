import type { LLMConfig } from '@/types';

// OpenAI 兼容 API 请求
export async function* streamChatCompletion(
  config: LLMConfig,
  systemPrompt: string,
  userContent: string
): AsyncGenerator<string, void, unknown> {
  const { provider, apiKey, baseUrl, model } = config;

  // 构建请求 URL
  let url: string;
  let headers: Record<string, string>;
  let body: Record<string, unknown>;

  if (provider === 'gemini') {
    // Gemini API 格式略有不同
    url = `${baseUrl}/models/${model}:streamGenerateContent?key=${apiKey}`;
    headers = {
      'Content-Type': 'application/json',
    };
    body = {
      contents: [
        {
          parts: [
            { text: systemPrompt + '\n\n' + userContent }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
      }
    };
  } else {
    // OpenAI 兼容格式
    url = `${baseUrl}/chat/completions`;
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    // Claude API 需要额外的 header
    if (provider === 'claude') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      delete headers['Authorization'];
    }

    body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      stream: true,
      temperature: 0.7,
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));

            // 处理不同格式的响应
            let content = '';
            if (provider === 'gemini') {
              content = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
            } else if (json.choices?.[0]?.delta?.content) {
              content = json.choices[0].delta.content;
            }

            if (content) {
              yield content;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// 测试 API 连接
export async function testConnection(config: LLMConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const { provider, apiKey, baseUrl, model } = config;

    if (!apiKey) {
      return { success: false, error: 'API Key 不能为空' };
    }

    let url: string;
    let headers: Record<string, string>;
    let body: Record<string, unknown>;

    if (provider === 'gemini') {
      url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      body = {
        contents: [{ parts: [{ text: 'Hi' }] }],
        generationConfig: { maxOutputTokens: 10 }
      };
    } else {
      url = `${baseUrl}/chat/completions`;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };

      if (provider === 'claude') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        delete headers['Authorization'];
      }

      body = {
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText.slice(0, 100);
      }

      return { success: false, error: errorMessage };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}
