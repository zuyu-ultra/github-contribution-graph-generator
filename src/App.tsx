import {
  AlertTriangle,
  ArrowDownToLine,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Clipboard,
  Code2,
  GitBranch,
  Github,
  Grid3X3,
  KeyRound,
  LockKeyhole,
  Paintbrush,
  Play,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Upload,
} from 'lucide-react'
import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from 'react'

type Level = 0 | 1 | 2 | 3 | 4
type Heatmap = Record<string, Level>
type Preset = 'balanced' | 'dense' | 'workweek' | 'wave' | 'clear'
type Language = 'en' | 'zh'

interface DayCell {
  date: string
  dayIndex: number
  weekIndex: number
  inRange: boolean
}

const LEVEL_COLORS = ['#202522', '#8bd36d', '#52bd58', '#2d983f', '#18712d']

const COPY = {
  en: {
    localOnly: 'Local only', docs: 'Contribution rules', eyebrow: 'GitHub contribution graph generator / v1.0',
    heroLine: 'Design your contribution graph.', heroAccent: 'Export one safe script.',
    heroDescription: 'Set a date range, shape the activity density, preview the exact heatmap, and export a Bash script you can review before running.',
    noPasswords: 'No passwords collected', platforms: 'macOS / Linux', authFriendly: 'Works with GitHub CLI',
    targetRules: 'Target & rules', repository: 'GitHub repository', httpsSsh: 'HTTPS or SSH', invalidRepo: 'Enter a complete github.com repository URL',
    branch: 'Target branch', defaultBranch: 'Use the default branch', invalidBranch: 'This is not a valid Git branch name', nonDefaultBranch: 'Contributions on a non-default branch usually do not count',
    startDate: 'Start date', endDate: 'End date', invalidDates: 'The end date must be after the start date', tooManyDays: 'GitHub’s main graph should cover no more than 366 days',
    dailyRange: 'Daily commit range', rangeHint: '1—20', invalidRange: 'Use a range where 1 ≤ minimum ≤ maximum ≤ 20', advanced: 'Advanced settings',
    timezone: 'Timezone offset', authorName: 'Author name', localGit: 'Leave blank to use local Git', authorPlaceholder: 'e.g. Mona Lisa', linkedEmail: 'GitHub-linked email', commitPrefix: 'Commit message prefix',
    skipExisting: 'Skip existing dates', skipExistingHint: 'Avoid duplicates when running again', confirmPush: 'Confirm before push', confirmPushHint: 'Show a y/N prompt in the terminal',
    configReady: 'Configuration ready', configWaiting: 'Waiting for valid settings', configFix: 'Fix the highlighted fields to export the script',
    graphTitle: 'Contribution heatmap', activeDays: 'active days', plannedCommits: 'planned commits', coveredDays: 'days covered',
    presets: 'Density presets', natural: 'Natural', dense: 'Dense', workweek: 'Workweek', wave: 'Wave', clear: 'Clear', importImage: 'Import reference', imageLocal: 'The image is sampled locally in your browser',
    hoverDate: 'Hover a cell to inspect', painter: 'Brush', adjust: 'Click or drag cells to fine-tune',
    githubCriteria: 'What GitHub counts', criteriaText: 'The author email must be linked, the repository cannot be a fork, and commits must reach the default branch or gh-pages.',
    scriptTitle: 'Executable script', copy: 'Copy', copied: 'Copied', download: 'Download .sh', downloaded: 'Downloaded', readyReview: 'READY TO REVIEW', configRequired: 'CONFIG REQUIRED',
    runAfterDownload: 'Run after download', authNote: 'No password is embedded. Pushes use your local Git credentials; run gh auth login first if needed.',
    localGenerated: 'Generated locally, nothing uploaded', lines: 'lines', footerDescription: 'A local-first GitHub contribution graph script generator.', footerTagline: 'Read the script before you run it.',
    invalidScript: '# Fix the configuration to generate a script.', paintAria: 'Select brush level',
    levelLabels: ['Empty', 'Low', 'Moderate', 'Active', 'Dense'],
  },
  zh: {
    localOnly: '仅本地运行', docs: '计入规则', eyebrow: 'GitHub 贡献图生成器 / v1.0',
    heroLine: '设计你的 GitHub 贡献图。', heroAccent: '导出一份安全脚本。',
    heroDescription: '设置日期范围和活跃密度，预览最终热力图，然后导出一份可在运行前检查的 Bash 脚本。',
    noPasswords: '不收集密码', platforms: 'macOS / Linux', authFriendly: '支持 GitHub CLI',
    targetRules: '目标与规则', repository: 'GitHub 仓库', httpsSsh: 'HTTPS 或 SSH', invalidRepo: '请输入完整的 github.com 仓库地址',
    branch: '目标分支', defaultBranch: '建议使用默认分支', invalidBranch: '分支名称包含 Git 不允许的字符', nonDefaultBranch: '非默认分支的提交通常不会计入贡献墙',
    startDate: '开始日期', endDate: '结束日期', invalidDates: '结束日期需要晚于开始日期', tooManyDays: 'GitHub 主墙最多建议覆盖 366 天',
    dailyRange: '每日提交范围', rangeHint: '1—20', invalidRange: '范围需满足 1 ≤ 最小值 ≤ 最大值 ≤ 20', advanced: '高级设置',
    timezone: '时区偏移', authorName: '作者名称', localGit: '留空读取本机 Git', authorPlaceholder: '例如 Mona Lisa', linkedEmail: 'GitHub 关联邮箱', commitPrefix: '提交信息前缀',
    skipExisting: '跳过已有日期', skipExistingHint: '重复运行时避免再次补充', confirmPush: '推送前再次确认', confirmPushHint: '在终端显示 y/N 提示',
    configReady: '配置已就绪', configWaiting: '等待有效配置', configFix: '修正上方标记后即可导出脚本',
    graphTitle: '贡献热力图', activeDays: '活跃天', plannedCommits: '预计提交', coveredDays: '覆盖天数',
    presets: '分布模板', natural: '自然', dense: '高密', workweek: '工作日', wave: '波浪', clear: '清空', importImage: '导入参考图', imageLocal: '图片仅在浏览器中采样',
    hoverDate: '悬停查看日期', painter: '画笔', adjust: '点击或拖动画格进行微调',
    githubCriteria: 'GitHub 计入条件', criteriaText: '作者邮箱必须关联账号，仓库不能是 fork，提交需位于默认分支或 gh-pages。',
    scriptTitle: '可执行脚本', copy: '复制', copied: '已复制', download: '下载 .sh', downloaded: '已下载', readyReview: '可以检查', configRequired: '需要有效配置',
    runAfterDownload: '下载后运行', authNote: '脚本不包含密码。推送使用本机 Git 凭据；未登录时先执行 gh auth login。',
    localGenerated: '本地生成，无网络传输', lines: '行', footerDescription: '一个本地优先的 GitHub 贡献图脚本生成器。', footerTagline: '执行前请先阅读脚本。',
    invalidScript: '# 请先修正配置，再生成脚本。', paintAria: '选择画笔等级',
    levelLabels: ['空白', '少量', '适中', '活跃', '密集'],
  },
} as const

function toLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function diffDays(start: Date, end: Date) {
  const dayMs = 24 * 60 * 60 * 1000
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.floor((utcEnd - utcStart) / dayMs)
}

function todayString() {
  return formatDate(new Date())
}

function defaultStartString() {
  return formatDate(addDays(new Date(), -364))
}

function hashDate(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function levelForPreset(preset: Preset, date: Date, index: number): Level {
  const day = date.getDay()
  if (preset === 'clear') return 0
  if (preset === 'dense') return ((index + day) % 5 === 0 ? 3 : 4) as Level
  if (preset === 'workweek') {
    if (day === 0 || day === 6) return 0
    return (1 + (hashDate(formatDate(date)) % 4)) as Level
  }
  if (preset === 'wave') {
    const wave = Math.sin(index / 7.2) + Math.sin(index / 19)
    return Math.max(1, Math.min(4, Math.round(2.6 + wave))) as Level
  }
  return (1 + (hashDate(formatDate(date)) % 4)) as Level
}

function buildHeatmap(start: string, end: string, preset: Preset, previous?: Heatmap) {
  const result: Heatmap = {}
  const startDate = toLocalDate(start)
  const endDate = toLocalDate(end)
  const total = Math.max(0, diffDays(startDate, endDate))
  for (let index = 0; index <= total; index += 1) {
    const date = addDays(startDate, index)
    const key = formatDate(date)
    result[key] = previous?.[key] ?? levelForPreset(preset, date, index)
  }
  return result
}

function makeGrid(start: string, end: string): DayCell[] {
  const startDate = toLocalDate(start)
  const endDate = toLocalDate(end)
  const gridStart = addDays(startDate, -startDate.getDay())
  const gridEnd = addDays(endDate, 6 - endDate.getDay())
  const cells: DayCell[] = []
  const total = diffDays(gridStart, gridEnd)
  for (let index = 0; index <= total; index += 1) {
    const current = addDays(gridStart, index)
    cells.push({
      date: formatDate(current),
      dayIndex: current.getDay(),
      weekIndex: Math.floor(index / 7),
      inRange: current >= startDate && current <= endDate,
    })
  }
  return cells
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

function levelToCount(level: Level, min: number, max: number) {
  if (level === 0) return 0
  if (max <= min) return min
  return Math.round(min + ((level - 1) / 3) * (max - min))
}

function generateScript(config: {
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
  heatmap: Heatmap
}) {
  const plan = Object.entries(config.heatmap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, level]) => `${date}|${levelToCount(level, config.minCommits, config.maxCommits)}`)
    .filter((line) => !line.endsWith('|0'))
    .join('\n')

  return `#!/usr/bin/env bash
set -Eeuo pipefail

# Generated by GitHub Contribution Graph Generator. Review before running.
REPOSITORY_URL=${shellQuote(config.repository)}
TARGET_BRANCH=${shellQuote(config.branch)}
AUTHOR_NAME=${shellQuote(config.authorName)}
AUTHOR_EMAIL=${shellQuote(config.authorEmail)}
COMMIT_PREFIX=${shellQuote(config.commitPrefix)}
TIMEZONE_OFFSET=${shellQuote(config.timezone)}
SKIP_EXISTING=${config.skipExisting ? 'true' : 'false'}
CONFIRM_BEFORE_PUSH=${config.confirmPush ? 'true' : 'false'}

command -v git >/dev/null 2>&1 || {
  echo "Error: Git is required. Install it from https://git-scm.com/"
  exit 1
}

if [[ -z "$AUTHOR_NAME" ]]; then
  AUTHOR_NAME="$(git config --global user.name || true)"
fi
if [[ -z "$AUTHOR_EMAIL" ]]; then
  AUTHOR_EMAIL="$(git config --global user.email || true)"
fi
if [[ -z "$AUTHOR_NAME" ]]; then
  read -r -p "Git author name: " AUTHOR_NAME
fi
if [[ -z "$AUTHOR_EMAIL" ]]; then
  read -r -p "GitHub-linked author email: " AUTHOR_EMAIL
fi

if [[ -z "$AUTHOR_NAME" || -z "$AUTHOR_EMAIL" ]]; then
  echo "Error: author name and a GitHub-linked email are required."
  exit 1
fi

task_base="${'${TMPDIR:-/tmp}'}"
task_base="${'${task_base%/}'}"
task_dir="$(mktemp -d "${'${task_base}'}/github-contribution-graph.XXXXXX")"
repo_dir="${'${task_dir}'}/repository"

cleanup() {
  status=$?
  if [[ $status -eq 0 && "$task_dir" == "${'${task_base}'}/github-contribution-graph."* ]]; then
    rm -rf -- "$task_dir"
  else
    echo "Working copy kept at: $task_dir"
  fi
}
trap cleanup EXIT

echo "Cloning $REPOSITORY_URL"
git clone "$REPOSITORY_URL" "$repo_dir"
cd "$repo_dir"

if git show-ref --verify --quiet "refs/remotes/origin/$TARGET_BRANCH"; then
  git switch -C "$TARGET_BRANCH" "origin/$TARGET_BRANCH"
elif git rev-parse --verify HEAD >/dev/null 2>&1; then
  git switch -c "$TARGET_BRANCH"
else
  git symbolic-ref HEAD "refs/heads/$TARGET_BRANCH"
fi

git config user.name "$AUTHOR_NAME"
git config user.email "$AUTHOR_EMAIL"
git config commit.gpgSign false

existing_dates=""
if [[ "$SKIP_EXISTING" == "true" ]] && git rev-parse --verify HEAD >/dev/null 2>&1; then
  existing_dates="$(git log --all --format='%ae|%aI' | awk -F'|' -v email="$AUTHOR_EMAIL" '$1 == email { print substr($2, 1, 10) }' | sort -u)"
fi

created=0
skipped=0
while IFS='|' read -r day count; do
  [[ -z "$day" || "$count" -le 0 ]] && continue

  if [[ "$SKIP_EXISTING" == "true" ]] && grep -Fxq "$day" <<< "$existing_dates"; then
    skipped=$((skipped + 1))
    continue
  fi

  index=1
  while [[ $index -le $count ]]; do
    if [[ $count -eq 1 ]]; then
      hour=12
    else
      hour=$((9 + ((index - 1) * 10 / (count - 1))))
    fi
    minute=$(((index * 17 + count * 7) % 60))
    printf -v hour_padded '%02d' "$hour"
    printf -v minute_padded '%02d' "$minute"
    stamp="${'${day}'}T${'${hour_padded}'}:${'${minute_padded}'}:00${'${TIMEZONE_OFFSET}'}"
    message="${'${COMMIT_PREFIX}'}: ${'${day}'} (${'${index}'}/${'${count}'})"

    GIT_AUTHOR_DATE="$stamp" GIT_COMMITTER_DATE="$stamp" \
      git commit --allow-empty --quiet -m "$message"

    created=$((created + 1))
    index=$((index + 1))
  done
done <<'COMMIT_PLAN'
${plan}
COMMIT_PLAN

echo "Prepared $created commits; skipped $skipped existing dates."
echo "Target: $REPOSITORY_URL ($TARGET_BRANCH)"

if [[ $created -eq 0 ]]; then
  echo "Nothing to push."
  exit 0
fi

if [[ "$CONFIRM_BEFORE_PUSH" == "true" ]]; then
  read -r -p "Push these commits to GitHub? [y/N] " answer
  if [[ ! "$answer" =~ ^[Yy]$ ]]; then
    echo "Push cancelled."
    exit 2
  fi
fi

git push -u origin "$TARGET_BRANCH"
echo "Done. GitHub may take a few minutes to refresh the contribution graph."
`
}

function FieldLabel({ title, hint, htmlFor }: { title: string; hint?: string; htmlFor?: string }) {
  return (
    <div className="field-label">
      <label htmlFor={htmlFor}>{title}</label>
      {hint && <span>{hint}</span>}
    </div>
  )
}

function App() {
  const [language, setLanguage] = useState<Language>('en')
  const copy = COPY[language]
  const [repository, setRepository] = useState('https://github.com/your-username/your-repository.git')
  const [branch, setBranch] = useState('main')
  const [start, setStart] = useState(defaultStartString())
  const [end, setEnd] = useState(todayString())
  const [minCommits, setMinCommits] = useState(1)
  const [maxCommits, setMaxCommits] = useState(4)
  const [timezone, setTimezone] = useState('+08:00')
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [commitPrefix, setCommitPrefix] = useState('Learning activity')
  const [skipExisting, setSkipExisting] = useState(true)
  const [confirmPush, setConfirmPush] = useState(true)
  const [preset, setPreset] = useState<Preset>('balanced')
  const [heatmap, setHeatmap] = useState<Heatmap>(() => buildHeatmap(defaultStartString(), todayString(), 'balanced'))
  const [paintLevel, setPaintLevel] = useState<Level>(4)
  const [isPainting, setIsPainting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [imageName, setImageName] = useState('')
  const [hoveredDate, setHoveredDate] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dayCount = useMemo(() => diffDays(toLocalDate(start), toLocalDate(end)) + 1, [start, end])
  const dateError = dayCount <= 0 ? copy.invalidDates : dayCount > 366 ? copy.tooManyDays : ''
  const rangeError = minCommits < 1 || maxCommits < minCommits || maxCommits > 20
  const repoValid = /^(https:\/\/github\.com\/[^/]+\/[^/]+(?:\.git)?\/?|git@github\.com:[^/]+\/[^/]+(?:\.git)?)$/.test(repository.trim())
  const trimmedBranch = branch.trim()
  const branchValid = Boolean(trimmedBranch)
    && !/[\s~^:?*[\]\\]/.test(trimmedBranch)
    && !trimmedBranch.includes('..')
    && !trimmedBranch.includes('@{')
    && !trimmedBranch.startsWith('.')
    && !trimmedBranch.endsWith('/')
    && !trimmedBranch.endsWith('.lock')
  const isValid = !dateError && !rangeError && repoValid && branchValid

  useEffect(() => {
    if (dayCount > 0 && dayCount <= 366) {
      setHeatmap((current) => buildHeatmap(start, end, preset, current))
    }
  }, [start, end, dayCount, preset])

  useEffect(() => {
    const stopPainting = () => setIsPainting(false)
    window.addEventListener('pointerup', stopPainting)
    window.addEventListener('pointercancel', stopPainting)
    return () => {
      window.removeEventListener('pointerup', stopPainting)
      window.removeEventListener('pointercancel', stopPainting)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN'
    document.title = language === 'en'
      ? 'GitHub Contribution Graph Generator'
      : 'GitHub 贡献图生成器'
  }, [language])

  const grid = useMemo(() => (dateError ? [] : makeGrid(start, end)), [start, end, dateError])
  const weekCount = grid.length / 7
  const activeDays = Object.values(heatmap).filter(Boolean).length
  const totalCommits = Object.values(heatmap).reduce<number>(
    (sum, level) => sum + levelToCount(level, minCommits, maxCommits),
    0,
  )
  const hoveredLevel = hoveredDate ? heatmap[hoveredDate] ?? 0 : 0
  const hoveredCommits = levelToCount(hoveredLevel, minCommits, maxCommits)
  const repositoryLabel = repository
    .replace(/^git@github\.com:/, '')
    .replace(/^https:\/\/github\.com\//, '')
    .replace(/\.git\/?$/, '')
    .replace(/\/$/, '')

  const script = useMemo(
    () =>
      isValid
        ? generateScript({
            repository: repository.trim(),
            branch: branch.trim(),
            start,
            end,
            minCommits,
            maxCommits,
            timezone,
            authorName,
            authorEmail,
            commitPrefix,
            skipExisting,
            confirmPush,
            heatmap,
          })
        : copy.invalidScript,
    [
      repository,
      branch,
      start,
      end,
      minCommits,
      maxCommits,
      timezone,
      authorName,
      authorEmail,
      commitPrefix,
      skipExisting,
      confirmPush,
      heatmap,
      isValid,
      copy.invalidScript,
    ],
  )

  const applyPreset = (nextPreset: Preset) => {
    setPreset(nextPreset)
    setImageName('')
    setHeatmap(buildHeatmap(start, end, nextPreset))
  }

  const paint = (date: string) => {
    setHeatmap((current) => ({ ...current, [date]: paintLevel }))
    setPreset('balanced')
  }

  const handleCellPointerDown = (event: PointerEvent<HTMLButtonElement>, date: string) => {
    event.preventDefault()
    setIsPainting(true)
    paint(date)
  }

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !grid.length) return
    setImageName(file.name)
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = weekCount
      canvas.height = 7
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height)
      const width = image.width * scale
      const height = image.height * scale
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      const next = { ...heatmap }
      grid.forEach((cell) => {
        if (!cell.inRange) return
        const pixelIndex = (cell.dayIndex * canvas.width + cell.weekIndex) * 4
        const red = pixels[pixelIndex]
        const green = pixels[pixelIndex + 1]
        const blue = pixels[pixelIndex + 2]
        const alpha = pixels[pixelIndex + 3] / 255
        const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
        const strength = (1 - luminance) * alpha
        next[cell.date] = strength < 0.09 ? 0 : Math.max(1, Math.min(4, Math.ceil(strength * 4))) as Level
      })
      setHeatmap(next)
      URL.revokeObjectURL(image.src)
    }
    image.src = URL.createObjectURL(file)
    event.target.value = ''
  }

  const copyScript = async () => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(script)
    } else {
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

  return (
    <main className="app-shell" onPointerUp={() => setIsPainting(false)} onPointerLeave={() => setIsPainting(false)}>
      <div className="ambient-grid" />
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            {[1, 2, 3, 2, 4, 2, 1, 3, 2].map((level, index) => (
              <i key={index} style={{ opacity: 0.18 + level * 0.2 }} />
            ))}
          </div>
          <span>GitHub Contribution Graph</span>
          <b>Generator</b>
        </div>
        <div className="topbar-actions">
          <div className="language-switch" role="group" aria-label="Language">
            <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
            <button className={language === 'zh' ? 'active' : ''} onClick={() => setLanguage('zh')}>中文</button>
          </div>
          <span className="local-pill"><LockKeyhole size={13} /> {copy.localOnly}</span>
          <a href="https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference" target="_blank" rel="noreferrer">
            {copy.docs} <ChevronRight size={14} />
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={14} /> {copy.eyebrow}</div>
        <h1>{copy.heroLine}<br /><em>{copy.heroAccent}</em></h1>
        <p>{copy.heroDescription}</p>
        <div className="hero-proof">
          <span><ShieldCheck size={15} /> {copy.noPasswords}</span>
          <span><TerminalSquare size={15} /> {copy.platforms}</span>
          <span><Github size={15} /> {copy.authFriendly}</span>
        </div>
      </section>

      <section className="studio">
        <aside className="config-panel panel">
          <div className="panel-heading">
            <span className="step-number">01</span>
            <div><p>CONFIGURE</p><h2>{copy.targetRules}</h2></div>
          </div>

          <div className="field-group">
            <FieldLabel title={copy.repository} hint={copy.httpsSsh} htmlFor="repository" />
            <div className={`input-shell ${!repoValid ? 'invalid' : ''}`}>
              <Github size={16} />
              <input id="repository" value={repository} onChange={(event) => setRepository(event.target.value)} spellCheck={false} />
            </div>
            {!repoValid && <p className="field-error">{copy.invalidRepo}</p>}
          </div>

          <div className="field-group">
            <FieldLabel title={copy.branch} hint={copy.defaultBranch} htmlFor="branch" />
            <div className={`input-shell mono-input ${!branchValid ? 'invalid' : ''}`}>
              <Code2 size={16} />
              <input id="branch" value={branch} onChange={(event) => setBranch(event.target.value)} spellCheck={false} />
            </div>
            {!branchValid && <p className="field-error">{copy.invalidBranch}</p>}
            {branch !== 'main' && branch !== 'master' && branch !== 'gh-pages' && (
              <p className="field-note"><AlertTriangle size={13} /> {copy.nonDefaultBranch}</p>
            )}
          </div>

          <div className="field-row">
            <div className="field-group">
              <FieldLabel title={copy.startDate} htmlFor="start-date" />
              <input id="start-date" className="date-input" type="date" value={start} max={end} onChange={(event) => setStart(event.target.value)} />
            </div>
            <div className="field-group">
              <FieldLabel title={copy.endDate} htmlFor="end-date" />
              <input id="end-date" className="date-input" type="date" value={end} min={start} onChange={(event) => setEnd(event.target.value)} />
            </div>
          </div>
          {dateError && <p className="field-error standalone">{dateError}</p>}

          <div className="field-group">
            <FieldLabel title={copy.dailyRange} hint={copy.rangeHint} />
            <div className="range-pair">
              <label><span>MIN</span><input type="number" min="1" max="20" value={minCommits} onChange={(event) => setMinCommits(Number(event.target.value))} /></label>
              <i>→</i>
              <label><span>MAX</span><input type="number" min="1" max="20" value={maxCommits} onChange={(event) => setMaxCommits(Number(event.target.value))} /></label>
            </div>
            {rangeError && <p className="field-error">{copy.invalidRange}</p>}
          </div>

          <details className="advanced">
            <summary>{copy.advanced} <ChevronRight size={15} /></summary>
            <div className="advanced-body">
              <div className="field-group">
                <FieldLabel title={copy.timezone} htmlFor="timezone" />
                <select id="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                  {['-08:00', '-05:00', '+00:00', '+01:00', '+08:00', '+09:00'].map((zone) => <option key={zone}>{zone}</option>)}
                </select>
              </div>
              <div className="field-group">
                <FieldLabel title={copy.authorName} hint={copy.localGit} htmlFor="author-name" />
                <input id="author-name" value={authorName} onChange={(event) => setAuthorName(event.target.value)} placeholder={copy.authorPlaceholder} />
              </div>
              <div className="field-group">
                <FieldLabel title={copy.linkedEmail} hint={copy.localGit} htmlFor="author-email" />
                <input id="author-email" type="email" value={authorEmail} onChange={(event) => setAuthorEmail(event.target.value)} placeholder="you@example.com" />
              </div>
              <div className="field-group">
                <FieldLabel title={copy.commitPrefix} htmlFor="commit-prefix" />
                <input id="commit-prefix" value={commitPrefix} onChange={(event) => setCommitPrefix(event.target.value)} />
              </div>
            </div>
          </details>

          <div className="toggle-stack">
            <label className="toggle-row">
              <div><strong>{copy.skipExisting}</strong><span>{copy.skipExistingHint}</span></div>
              <input type="checkbox" checked={skipExisting} onChange={(event) => setSkipExisting(event.target.checked)} />
              <i />
            </label>
            <label className="toggle-row">
              <div><strong>{copy.confirmPush}</strong><span>{copy.confirmPushHint}</span></div>
              <input type="checkbox" checked={confirmPush} onChange={(event) => setConfirmPush(event.target.checked)} />
              <i />
            </label>
          </div>

          <div className={`config-health ${isValid ? 'ready' : ''}`} aria-live="polite">
            {isValid ? <CircleCheck size={16} /> : <AlertTriangle size={16} />}
            <div>
              <strong>{isValid ? copy.configReady : copy.configWaiting}</strong>
              <span>{isValid ? `${repositoryLabel} · ${branch}` : copy.configFix}</span>
            </div>
          </div>
        </aside>

        <div className="workspace-column">
          <section className="heatmap-panel panel">
            <div className="panel-heading heatmap-heading">
              <span className="step-number">02</span>
              <div><p>COMPOSE</p><h2>{copy.graphTitle}</h2></div>
              <div className="metrics">
                <div><b>{activeDays}</b><span>{copy.activeDays}</span></div>
                <div><b>{totalCommits.toLocaleString()}</b><span>{copy.plannedCommits}</span></div>
                <div><b>{dayCount > 0 ? dayCount : 0}</b><span>{copy.coveredDays}</span></div>
              </div>
            </div>

            <div className="composer-tools">
              <div className="preset-group">
                <span>{copy.presets}</span>
                {([
                  ['balanced', copy.natural],
                  ['dense', copy.dense],
                  ['workweek', copy.workweek],
                  ['wave', copy.wave],
                  ['clear', copy.clear],
                ] as [Preset, string][]).map(([value, label]) => (
                  <button key={value} className={preset === value && !imageName ? 'active' : ''} onClick={() => applyPreset(value)}>{label}</button>
                ))}
              </div>
              <div className="reference-upload">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImage} hidden />
                <button onClick={() => fileInputRef.current?.click()}><Upload size={14} /> {imageName || copy.importImage}</button>
                <span>{copy.imageLocal}</span>
              </div>
            </div>

            <div className="heatmap-stage" onPointerLeave={() => setHoveredDate('')}>
              <div className="heatmap-topline">
                <div className="heatmap-meta"><span>{start}</span><i /> <span>{end}</span></div>
                <div className={`heatmap-inspector ${hoveredDate ? 'visible' : ''}`} aria-live="polite">
                  <CalendarDays size={13} />
                  <strong>{hoveredDate || copy.hoverDate}</strong>
                  <span>{hoveredDate ? `${copy.levelLabels[hoveredLevel]} · ${hoveredCommits}` : '—'}</span>
                </div>
              </div>
              <div className="heatmap-scroller">
                <div className="weekday-labels"><span>MON</span><span>WED</span><span>FRI</span></div>
                <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${weekCount}, 12px)` }}>
                  {grid.map((cell) => (
                    <button
                      key={cell.date}
                      type="button"
                      className={`heat-cell ${!cell.inRange ? 'outside' : ''}`}
                      style={{
                        gridColumn: cell.weekIndex + 1,
                        gridRow: cell.dayIndex + 1,
                        background: cell.inRange ? LEVEL_COLORS[heatmap[cell.date] ?? 0] : 'transparent',
                      }}
                      title={cell.inRange ? `${cell.date} · ${copy.levelLabels[heatmap[cell.date] ?? 0]}` : ''}
                      aria-label={cell.inRange ? `${cell.date}, ${copy.levelLabels[heatmap[cell.date] ?? 0]}, ${levelToCount(heatmap[cell.date] ?? 0, minCommits, maxCommits)}` : undefined}
                      disabled={!cell.inRange}
                      onPointerDown={(event) => handleCellPointerDown(event, cell.date)}
                      onPointerEnter={() => {
                        if (!cell.inRange) return
                        setHoveredDate(cell.date)
                        if (isPainting) paint(cell.date)
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="heatmap-footer">
                <div className="paint-control"><Paintbrush size={14} /><span>{copy.painter}</span>{LEVEL_COLORS.map((color, level) => (
                  <button
                    key={color}
                    aria-label={`${copy.paintAria}: ${copy.levelLabels[level]}`}
                    className={paintLevel === level ? 'selected' : ''}
                    style={{ background: color }}
                    onClick={() => setPaintLevel(level as Level)}
                  />
                ))}</div>
                <p>{copy.adjust}</p>
              </div>
            </div>

            <div className="rule-callout">
              <ShieldCheck size={18} />
              <div><strong>{copy.githubCriteria}</strong><p>{copy.criteriaText}</p></div>
            </div>
          </section>

          <section className="script-panel panel">
            <div className="panel-heading script-heading">
              <span className="step-number">03</span>
              <div><p>EXPORT</p><h2>{copy.scriptTitle}</h2></div>
              <div className="script-actions">
                <button onClick={copyScript} disabled={!isValid}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? copy.copied : copy.copy}</button>
                <button className="primary" onClick={downloadScript} disabled={!isValid}>{downloaded ? <Check size={15} /> : <ArrowDownToLine size={15} />}{downloaded ? copy.downloaded : copy.download}</button>
              </div>
            </div>
            <div className="terminal">
              <div className="terminal-bar">
                <span className="traffic"><i /><i /><i /></span>
                <span>generate-contributions.sh</span>
                <b><span className="status-dot" /> {isValid ? copy.readyReview : copy.configRequired}</b>
              </div>
              <pre><code>{script}</code></pre>
            </div>
            <div className="run-strip">
              <div className="run-icon"><Play size={18} fill="currentColor" /></div>
              <div><span>{copy.runAfterDownload}</span><code>chmod +x generate-contributions.sh && ./generate-contributions.sh</code></div>
              <div className="auth-note"><KeyRound size={15} /><span>{copy.authNote}</span></div>
            </div>
            <div className="script-summary">
              <span><GitBranch size={13} /> {branch || '—'}</span>
              <span><Code2 size={13} /> {script.split('\n').length.toLocaleString()} {copy.lines}</span>
              <span><ShieldCheck size={13} /> {copy.localGenerated}</span>
            </div>
          </section>
        </div>
      </section>

      <footer>
        <div><Grid3X3 size={16} /> GitHub Contribution Graph Generator</div>
        <p>{copy.footerDescription}</p>
        <span>{copy.footerTagline}</span>
      </footer>
    </main>
  )
}

export default App
