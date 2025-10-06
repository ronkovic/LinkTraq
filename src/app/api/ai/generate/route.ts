import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceOpenRouterClient, getUserOpenRouterClient } from '@/lib/ai/openrouter'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/generate
 * AI文章生成
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as {
      task?: string
      product_info?: any
      tone?: string
      length?: string
      hashtags_count?: number
      custom_instructions?: string
    }
    const {
      task,
      product_info,
      tone,
      length,
      hashtags_count,
      custom_instructions
    } = body

    // バリデーション
    if (!task || !product_info) {
      return NextResponse.json(
        { error: 'Missing required fields: task, product_info' },
        { status: 400 }
      )
    }

    // AI設定取得
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // OpenRouterクライアント取得
    let openRouterClient
    let modelToUse

    if (aiSettings?.use_own_api_key === 'true' && aiSettings.api_key) {
      // ユーザー自身のAPI Key使用
      openRouterClient = getUserOpenRouterClient(
        aiSettings.api_key,
        aiSettings.default_model
      )
      modelToUse = aiSettings.default_model
    } else {
      // サービス提供のAPI Key使用
      openRouterClient = getServiceOpenRouterClient()
      modelToUse = process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-v3.1:free'
    }

    // プロンプト生成
    const prompt = generatePrompt(task, product_info, {
      tone,
      length,
      hashtags_count,
      custom_instructions,
    })

    // AI呼び出し
    const response = await openRouterClient.chat([
      {
        role: 'system',
        content: 'あなたはSNSマーケティングの専門家です。商品を魅力的に紹介する投稿文を作成してください。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      model: modelToUse,
      temperature: 0.7,
      max_tokens: 500,
    })

    const generatedText = response.choices[0].message.content
    const tokensUsed = response.usage.total_tokens

    // 使用量更新 (サービス提供のAPI Key使用時のみ)
    if (aiSettings?.use_own_api_key !== 'true') {
      await supabase
        .from('ai_settings')
        .update({
          current_month_usage: (aiSettings?.current_month_usage || 0) + tokensUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      generated_text: generatedText,
      tokens_used: tokensUsed,
      model_used: modelToUse,
    })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI generation failed' },
      { status: 500 }
    )
  }
}

/**
 * プロンプト生成
 */
function generatePrompt(
  task: string,
  productInfo: any,
  options: {
    tone?: string
    length?: string
    hashtags_count?: number
    custom_instructions?: string
  }
): string {
  const { tone = 'friendly', length = 'medium', hashtags_count = 3, custom_instructions } = options

  let prompt = `タスク: ${task}\n\n`
  prompt += `商品情報:\n`
  prompt += `- 商品名: ${productInfo.name}\n`
  if (productInfo.description) {
    prompt += `- 説明: ${productInfo.description}\n`
  }
  if (productInfo.price) {
    prompt += `- 価格: ${productInfo.price} ${productInfo.currency || 'JPY'}\n`
  }
  if (productInfo.category) {
    prompt += `- カテゴリー: ${productInfo.category}\n`
  }

  prompt += `\n要件:\n`
  prompt += `- トーン: ${getToneDescription(tone)}\n`
  prompt += `- 長さ: ${getLengthDescription(length)}\n`
  prompt += `- ハッシュタグ数: ${hashtags_count}個\n`

  if (custom_instructions) {
    prompt += `\nカスタム指示:\n${custom_instructions}\n`
  }

  prompt += `\n注意事項:\n`
  prompt += `- 商品の魅力を自然に伝える\n`
  prompt += `- ターゲット層に響く言葉を選ぶ\n`
  prompt += `- ハッシュタグは関連性の高いものを選ぶ\n`
  prompt += `- アフィリエイトリンクは含めない (後で自動追加されます)\n`

  return prompt
}

/**
 * トーン説明取得
 */
function getToneDescription(tone: string): string {
  const toneMap: { [key: string]: string } = {
    friendly: 'フレンドリーで親しみやすい',
    professional: 'プロフェッショナルで信頼感のある',
    casual: 'カジュアルでリラックスした',
    enthusiastic: '熱意があり情熱的な',
    informative: '情報的で教育的な',
  }
  return toneMap[tone] || tone
}

/**
 * 長さ説明取得
 */
function getLengthDescription(length: string): string {
  const lengthMap: { [key: string]: string } = {
    short: '短い (50-100文字)',
    medium: '中程度 (100-200文字)',
    long: '長い (200-280文字)',
  }
  return lengthMap[length] || length
}
