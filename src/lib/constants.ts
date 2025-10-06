// AI Models
export const AI_MODELS = {
  DEEPSEEK_V31: 'deepseek/deepseek-v3.1:free',
  GEMINI_FLASH: 'google/gemini-2.0-flash-thinking-exp:free',
  LLAMA_4: 'meta-llama/llama-4-maverick:free',
  QWEN: 'qwen/qwq-32b:free',
} as const

// AI Tasks
export const AI_TASKS = {
  productDescription: AI_MODELS.DEEPSEEK_V31,
  productAnalysis: AI_MODELS.GEMINI_FLASH,
  hashtagSuggestion: AI_MODELS.LLAMA_4,
  postTimeOptimization: AI_MODELS.GEMINI_FLASH,
  templateGeneration: AI_MODELS.LLAMA_4,
} as const

// SNS Platforms
export const SNS_PLATFORMS = {
  X: 'x',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
} as const

// SNS Platform Limits
export const SNS_LIMITS = {
  x: {
    maxTextLength: 280,
    maxImages: 4,
    maxVideos: 1,
    maxHashtags: Infinity,
    recommendedHashtags: 5,
  },
  instagram: {
    maxTextLength: 2200,
    maxImages: 10,
    minImages: 1,
    maxVideos: 1,
    maxHashtags: 30,
    recommendedHashtags: 10,
  },
  facebook: {
    maxTextLength: 63206,
    recommendedTextLength: 500,
    maxImages: Infinity,
    maxVideos: 1,
    maxHashtags: Infinity,
    recommendedHashtags: 3,
  },
} as const

// X API Plans
export const X_API_PLANS = {
  FREE: { limit: 1500, name: 'Free' },
  BASIC: { limit: 3000, name: 'Basic' },
  PRO: { limit: -1, name: 'Pro' }, // -1 = unlimited
} as const

// Image sizes
export const IMAGE_SIZES = {
  x: { width: 1200, height: 675 }, // 16:9
  instagram: { width: 1080, height: 1080 }, // 1:1
  facebook: { width: 1200, height: 630 }, // 1.91:1
} as const
