import { Github, Moon, Sun } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from './components/Canvas'
import { Export } from './components/Export'
import { SettingsPanel } from './components/Settings'
import { Toolbar, type Draft } from './components/Toolbar'
import { COPY, detectLanguage, type Language } from './i18n'
import { diffDays, toDate } from './lib/date'
import { normalizeText } from './lib/font'
import {
  buildDefaultDrawing, buildGrid, buildPattern, buildRandom, centerOffset, clip, maxTextLength,
  sampleImage, stampText, summarize,
  type Heatmap, type Level, type Pattern,
} from './lib/heatmap'
import { generateScript } from './lib/script'
import {
  clearState, defaultSettings, loadState, repositoryLabel, saveState, validate,
  type Settings, type Theme,
} from './lib/settings'

const HISTORY_LIMIT = 60

const BRAND_WORD = 'KUSA'

const GITHUB_PROFILE = 'https://github.com/zuyu-ultra'
const GITHUB_REPOSITORY = 'https://github.com/zuyu-ultra/github-contribution-graph-generator'
const CONTRIBUTION_DOCS =
  'https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference'

function useSystemTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')

  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const query = matchMedia('(prefers-color-scheme: light)')
    const update = () => setTheme(query.matches ? 'light' : 'dark')
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return theme
}

export default function App() {
  const restored = useRef(loadState()).current

  const [language, setLanguage] = useState<Language>(restored.language ?? detectLanguage())
  const [themePreference, setThemePreference] = useState<Theme | 'system'>(restored.theme ?? 'system')
  const systemTheme = useSystemTheme()
  const theme = themePreference === 'system' ? systemTheme : themePreference
  const copy = COPY[language]

  const [settings, setSettings] = useState<Settings>(restored.settings ?? defaultSettings())
  const [map, setMap] = useState<Heatmap>(() => {
    if (restored.map) return restored.map
    const { start, end } = restored.settings ?? defaultSettings()
    return buildDefaultDrawing(start, end, BRAND_WORD)
  })

  const [past, setPast] = useState<Heatmap[]>([])
  const [future, setFuture] = useState<Heatmap[]>([])
  const [brush, setBrush] = useState<Level>(3)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [textRejected, setTextRejected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)
  // Read by the keydown listener, so the shortcut never re-registers on every stroke.
  const randomizeRef = useRef(() => {})

  const dayCount = useMemo(
    () => diffDays(toDate(settings.start), toDate(settings.end)) + 1,
    [settings.start, settings.end],
  )
  const validation = useMemo(() => validate(settings, dayCount), [settings, dayCount])
  const rangeUsable = validation.dateOrder && validation.dateLength

  const grid = useMemo(
    () => (rangeUsable ? buildGrid(settings.start, settings.end) : { cells: [], weeks: 0, monthMarks: [] }),
    [settings.start, settings.end, rangeUsable],
  )

  // Only the days inside the range are drawn, counted, exported or saved. The
  // stored map keeps everything, so shrinking the range never destroys work.
  const visible = useMemo(
    () => (rangeUsable ? clip(map, settings.start, settings.end) : {}),
    [map, settings.start, settings.end, rangeUsable],
  )

  // --- history -------------------------------------------------------------

  const snapshot = useCallback(() => {
    setPast((stack) => [...stack, map].slice(-HISTORY_LIMIT))
    setFuture([])
  }, [map])

  const commit = useCallback((next: Heatmap) => {
    setPast((stack) => [...stack, map].slice(-HISTORY_LIMIT))
    setFuture([])
    setMap(next)
  }, [map])

  const undo = useCallback(() => {
    setPast((stack) => {
      if (!stack.length) return stack
      const previous = stack[stack.length - 1]
      setFuture((forward) => [map, ...forward].slice(0, HISTORY_LIMIT))
      setMap(previous)
      return stack.slice(0, -1)
    })
  }, [map])

  const redo = useCallback(() => {
    setFuture((stack) => {
      if (!stack.length) return stack
      const [next, ...rest] = stack
      setPast((back) => [...back, map].slice(-HISTORY_LIMIT))
      setMap(next)
      return rest
    })
  }, [map])

  // --- drafts (text / image) ------------------------------------------------

  const normalizedText = draft?.kind === 'text' ? normalizeText(draft.text) : ''
  const charLimit = Math.max(1, maxTextLength(grid.weeks))
  const maxOffset = draft?.kind === 'text'
    ? Math.max(0, grid.weeks - (normalizedText.length * 6 - 1))
    : 0

  const preview = useMemo(() => {
    if (!draft) return visible
    if (draft.kind === 'text') {
      return normalizedText
        ? stampText(visible, grid, normalizedText, draft.level, Math.min(draft.offset, maxOffset))
        : visible
    }
    if (!imageRef.current) return visible
    return sampleImage(imageRef.current, visible, grid, { invert: draft.invert, threshold: draft.threshold })
  }, [draft, visible, grid, normalizedText, maxOffset])

  const openTextDraft = () => {
    if (draft?.kind === 'text') { setDraft(null); return }
    const seed = normalizeText(copy.textPlaceholder).slice(0, charLimit)
    setDraft({ kind: 'text', text: seed, level: 4, offset: centerOffset(seed, grid.weeks) })
    setTextRejected(false)
  }

  const changeDraft = (next: Draft) => {
    if (next.kind === 'text' && draft?.kind === 'text' && next.text !== draft.text) {
      setTextRejected(normalizeText(next.text).length !== Array.from(next.text).length)
      const normalized = normalizeText(next.text)
      // Re-centre while the user is still typing rather than after they stop.
      if (draft.offset === centerOffset(normalizeText(draft.text), grid.weeks)) {
        setDraft({ ...next, offset: centerOffset(normalized, grid.weeks) })
        return
      }
    }
    setDraft(next)
  }

  const pickImage = (file: File) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      imageRef.current = image
      setDraft({ kind: 'image', name: file.name, invert: false, threshold: 0.12 })
      URL.revokeObjectURL(url)
    }
    image.onerror = () => URL.revokeObjectURL(url)
    image.src = url
  }

  const commitDraft = () => {
    if (preview !== visible) commit({ ...map, ...preview })
    setDraft(null)
    imageRef.current = null
  }

  const cancelDraft = () => {
    setDraft(null)
    imageRef.current = null
  }

  const applyPattern = (pattern: Pattern) => {
    cancelDraft()
    commit(buildPattern(pattern, settings.start, settings.end))
  }

  const randomize = () => {
    cancelDraft()
    commit(buildRandom(settings.start, settings.end))
  }
  randomizeRef.current = randomize

  const paintCell = (date: string, level: Level) => {
    setMap((current) => (current[date] === level ? current : { ...current, [date]: level }))
  }

  // --- keyboard -------------------------------------------------------------

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (typing) return
      if (/^[0-4]$/.test(event.key)) setBrush(Number(event.key) as Level)
      if (event.key.toLowerCase() === 'r') randomizeRef.current()
      if (event.key === 'Escape' && draft) cancelDraft()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo, draft])

  // --- persistence & document chrome ---------------------------------------

  useEffect(() => {
    const timer = window.setTimeout(() => saveState(settings, visible, language, themePreference), 400)
    return () => window.clearTimeout(timer)
  }, [settings, visible, language, themePreference])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    document.title = language === 'zh'
      ? 'Kusa — 画你的 GitHub 贡献图'
      : 'Kusa — Draw your GitHub contribution graph'
  }, [theme, language])

  // --- derived --------------------------------------------------------------

  const stats = useMemo(
    () => summarize(visible, settings.minCommits, settings.maxCommits),
    [visible, settings.minCommits, settings.maxCommits],
  )

  const script = useMemo(() => {
    if (!validation.ok) return ''
    return generateScript({
      repository: settings.repository.trim(),
      branch: settings.branch.trim(),
      minCommits: settings.minCommits,
      maxCommits: settings.maxCommits,
      timezone: settings.timezone,
      authorName: settings.authorName.trim(),
      authorEmail: settings.authorEmail.trim(),
      commitPrefix: settings.commitPrefix,
      skipExisting: settings.skipExisting,
      confirmPush: settings.confirmPush,
      heatmap: visible,
    })
  }, [settings, visible, validation.ok])

  const placeholderScript = language === 'zh'
    ? '# 补全上方配置后，这里会显示可执行的脚本。'
    : '# Complete the configuration above and the script appears here.'

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(script)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = script
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const downloadScript = () => {
    const blob = new Blob([script], { type: 'text/x-shellscript;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'generate-contributions.sh'
    anchor.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
    window.setTimeout(() => setDownloaded(false), 1800)
  }

  const resetAll = () => {
    if (!window.confirm(copy.resetConfirm)) return
    const fresh = defaultSettings()
    clearState()
    cancelDraft()
    setSettings(fresh)
    setMap(buildDefaultDrawing(fresh.start, fresh.end, BRAND_WORD))
    setPast([])
    setFuture([])
  }

  const target = repositoryLabel(settings.repository)

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              {[1, 3, 2, 4, 2, 1, 3, 4, 2].map((level, index) => (
                <i key={index} data-level={level} />
              ))}
            </span>
            <span className="brand-name">{copy.appName}</span>
          </div>

          <div className="header-actions">
            <a className="header-link" href={CONTRIBUTION_DOCS} target="_blank" rel="noreferrer">
              {copy.docsLink}
            </a>
            <div className="segmented" role="group" aria-label={copy.languageLabel}>
              <button type="button" className={language === 'en' ? 'on' : ''} onClick={() => setLanguage('en')}>EN</button>
              <button type="button" className={language === 'zh' ? 'on' : ''} onClick={() => setLanguage('zh')}>中文</button>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label={copy.themeLabel}
              title={copy.themeLabel}
              onClick={() => setThemePreference(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a
              className="icon-button"
              href={GITHUB_PROFILE}
              target="_blank"
              rel="noreferrer"
              aria-label={copy.profileLink}
              title={copy.profileLink}
            >
              <Github size={16} />
            </a>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="intro">
          <h1>{copy.appTagline}</h1>
          <p>{copy.appSubtitle}</p>
        </div>

        <section className="card" aria-labelledby="step-draw">
          <div className="card-head">
            <div>
              <span className="step">1</span>
              <h2 id="step-draw">{copy.stepDraw}</h2>
              <p>{copy.stepDrawHint}</p>
            </div>
            <dl className="stats">
              <div><dt>{copy.statActiveDays}</dt><dd>{stats.activeDays}</dd></div>
              <div><dt>{copy.statCommits}</dt><dd>{stats.commits.toLocaleString()}</dd></div>
              <div><dt>{copy.statSpan}</dt><dd>{rangeUsable ? dayCount : 0}</dd></div>
            </dl>
          </div>

          <Toolbar
            copy={copy}
            theme={theme}
            brush={brush}
            onBrush={setBrush}
            canUndo={past.length > 0}
            canRedo={future.length > 0}
            onUndo={undo}
            onRedo={redo}
            onPattern={applyPattern}
            onRandomize={randomize}
            draft={draft}
            onDraftChange={changeDraft}
            onOpenText={openTextDraft}
            onPickImage={pickImage}
            onCommitDraft={commitDraft}
            onCancelDraft={cancelDraft}
            maxCharacters={charLimit}
            maxOffset={maxOffset}
            textRejected={textRejected}
          />

          {rangeUsable ? (
            <Canvas
              copy={copy}
              grid={grid}
              map={preview}
              minCommits={settings.minCommits}
              maxCommits={settings.maxCommits}
              theme={theme}
              brush={brush}
              onStrokeStart={snapshot}
              onPaint={paintCell}
            />
          ) : (
            <p className="empty-canvas">{validation.dateOrder ? copy.dateTooLong : copy.dateOrderInvalid}</p>
          )}
        </section>

        <section className="card" aria-labelledby="step-configure">
          <div className="card-head">
            <div>
              <span className="step">2</span>
              <h2 id="step-configure">{copy.stepConfigure}</h2>
              <p>{copy.stepConfigureHint}</p>
            </div>
            {target && validation.repository === 'ok' && (
              <code className="target-pill">{target} · {settings.branch}</code>
            )}
          </div>
          <SettingsPanel
            copy={copy}
            value={settings}
            validation={validation}
            onChange={(patch) => setSettings((current) => ({ ...current, ...patch }))}
            onReset={resetAll}
          />
        </section>

        <section className="card" aria-labelledby="step-export">
          <div className="card-head">
            <div>
              <span className="step">3</span>
              <h2 id="step-export">{copy.stepExport}</h2>
              <p>{copy.stepExportHint}</p>
            </div>
          </div>
          <Export
            copy={copy}
            script={script || placeholderScript}
            ready={validation.ok}
            hasDrawing={stats.commits > 0}
            commits={stats.commits}
            activeDays={stats.activeDays}
            copied={copied}
            downloaded={downloaded}
            onCopy={copyScript}
            onDownload={downloadScript}
          />
        </section>
      </main>

      <footer className="footer">
        <p>{copy.honesty}</p>
        <div className="footer-meta">
          <span>{copy.footer}</span>
          <nav className="footer-links">
            <a href={GITHUB_PROFILE} target="_blank" rel="noreferrer">{copy.profileLink}</a>
            <a href={GITHUB_REPOSITORY} target="_blank" rel="noreferrer">{copy.sourceLink}</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
