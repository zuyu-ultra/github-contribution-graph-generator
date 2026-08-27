import { daysAgo, localTimezoneOffset, today } from './date'
import { decodeMap, encodeMap, type Heatmap } from './heatmap'
import type { Language } from '../i18n'

export interface Settings {
  repository: string
  branch: string
  start: string
  end: string
  minCommits: number
  maxCommits: number
  timezone: string
  authorName: string
  authorEmail: string
  commitPrefix: string
  skipExisting: boolean
  confirmPush: boolean
}

export type Theme = 'light' | 'dark'

export function defaultSettings(): Settings {
  return {
    repository: '',
    branch: 'main',
    start: daysAgo(364),
    end: today(),
    minCommits: 1,
    maxCommits: 4,
    timezone: localTimezoneOffset(),
    authorName: '',
    authorEmail: '',
    commitPrefix: 'chore: activity',
    skipExisting: true,
    confirmPush: true,
  }
}

const REPO_PATTERN =
  /^(?:https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?\/?|git@github\.com:[\w.-]+\/[\w.-]+(?:\.git)?)$/

export interface Validation {
  repository: 'ok' | 'empty' | 'invalid'
  branch: boolean
  dateOrder: boolean
  dateLength: boolean
  intensity: boolean
  ok: boolean
}

export function validate(settings: Settings, dayCount: number): Validation {
  const repository = !settings.repository.trim()
    ? 'empty'
    : REPO_PATTERN.test(settings.repository.trim())
      ? 'ok'
      : 'invalid'

  const name = settings.branch.trim()
  const branch = Boolean(name)
    && !/[\s~^:?*[\]\\]/.test(name)
    && !name.includes('..')
    && !name.includes('@{')
    && !name.startsWith('.')
    && !name.startsWith('/')
    && !name.endsWith('/')
    && !name.endsWith('.lock')

  const dateOrder = dayCount > 0
  const dateLength = dayCount <= 366
  const intensity =
    Number.isFinite(settings.minCommits)
    && Number.isFinite(settings.maxCommits)
    && settings.minCommits >= 1
    && settings.maxCommits >= settings.minCommits
    && settings.maxCommits <= 20

  return {
    repository,
    branch,
    dateOrder,
    dateLength,
    intensity,
    ok: repository === 'ok' && branch && dateOrder && dateLength && intensity,
  }
}

export function repositoryLabel(url: string) {
  return url.trim()
    .replace(/^git@github\.com:/, '')
    .replace(/^https:\/\/github\.com\//, '')
    .replace(/\.git\/?$/, '')
    .replace(/\/$/, '')
}

const STORAGE_KEY = 'contribution-studio/v1'

interface Persisted {
  settings: Settings
  drawing: string
  language: Language
  theme: Theme | 'system'
}

export function loadState(): Partial<Persisted> & { map?: Heatmap } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<Persisted>
    const settings = parsed.settings ? { ...defaultSettings(), ...parsed.settings } : undefined
    return {
      settings,
      language: parsed.language,
      theme: parsed.theme,
      map: settings && parsed.drawing ? decodeMap(parsed.drawing, settings.start) : undefined,
    }
  } catch {
    return {}
  }
}

export function saveState(
  settings: Settings,
  map: Heatmap,
  language: Language,
  theme: Theme | 'system',
) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      settings,
      drawing: encodeMap(map, settings.start, settings.end),
      language,
      theme,
    }))
  } catch {
    // A full or disabled storage quota is not worth interrupting the user for.
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
