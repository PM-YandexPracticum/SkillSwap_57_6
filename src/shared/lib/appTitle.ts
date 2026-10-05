const DEFAULT_APP_TITLE = 'SkillSwap'

const envTitle = import.meta.env.VITE_APP_TITLE

export const APP_TITLE = envTitle || DEFAULT_APP_TITLE
