export type Language = 'en' | 'zh'

export interface Copy {
  appName: string
  appTagline: string
  localOnly: string
  docsLink: string
  themeLabel: string
  languageLabel: string

  stepDraw: string
  stepConfigure: string
  stepExport: string
  stepDrawHint: string
  stepConfigureHint: string
  stepExportHint: string

  brush: string
  brushHint: string
  undo: string
  redo: string
  patterns: string
  natural: string
  dense: string
  weekday: string
  wave: string
  ramp: string
  clear: string
  textTool: string
  imageTool: string
  textPlaceholder: string
  textIntensity: string
  textPosition: string
  textApply: string
  textCancel: string
  textTooLong: (max: number) => string
  textUnsupported: string
  imageInvert: string
  imageThreshold: string
  imageChoose: string
  imageHint: string
  imageApply: string
  less: string
  more: string
  weekdayShort: readonly string[]
  monthShort: readonly string[]
  levelLabels: readonly string[]
  statActiveDays: string
  statCommits: string
  statSpan: string
  commitsOnDate: (count: number) => string
  noCommitsOnDate: string

  repository: string
  repositoryPlaceholder: string
  repositoryHint: string
  repositoryRequired: string
  repositoryInvalid: string
  branch: string
  branchInvalid: string
  branchWarning: string
  dateRange: string
  lastYear: string
  lastSixMonths: string
  thisYear: string
  startDate: string
  endDate: string
  dateOrderInvalid: string
  dateTooLong: string
  intensity: string
  intensityHint: string
  intensityInvalid: string
  min: string
  max: string
  timezone: string
  timezoneDetected: string
  identity: string
  authorName: string
  authorEmail: string
  identityHint: string
  emailWarning: string
  commitPrefix: string
  commitPrefixHint: string
  skipExisting: string
  skipExistingHint: string
  confirmPush: string
  confirmPushHint: string
  reset: string
  resetConfirm: string

  copy: string
  copied: string
  download: string
  downloaded: string
  blockedTitle: string
  readyTitle: (commits: number, days: number) => string
  emptyTitle: string
  runIt: string
  scriptLines: (count: number) => string
  authNote: string
  criteriaTitle: string
  criteria: readonly string[]
  honesty: string
  footer: string
  profileLink: string
  sourceLink: string
}

export const COPY: Record<Language, Copy> = {
  en: {
    // shell
    appName: 'Kusa',
    appTagline: 'Draw a GitHub contribution graph, export a script you can read.',
    localOnly: 'Runs entirely in your browser',
    docsLink: 'How GitHub counts contributions',
    themeLabel: 'Switch colour theme',
    languageLabel: 'Language',

    // steps
    stepDraw: 'Draw',
    stepConfigure: 'Configure',
    stepExport: 'Export',
    stepDrawHint: 'Click and drag the grid, or start from a pattern.',
    stepConfigureHint: 'Tell the script which repository to write to.',
    stepExportHint: 'Read it, download it, run it.',

    // canvas
    brush: 'Brush',
    brushHint: 'Drag to paint · hold Alt to erase',
    undo: 'Undo',
    redo: 'Redo',
    patterns: 'Patterns',
    natural: 'Natural',
    dense: 'Dense',
    weekday: 'Weekdays',
    wave: 'Wave',
    ramp: 'Ramp up',
    clear: 'Clear all',
    textTool: 'Text',
    imageTool: 'Image',
    textPlaceholder: 'HELLO',
    textIntensity: 'Shade',
    textPosition: 'Position',
    textApply: 'Place text',
    textCancel: 'Cancel',
    textTooLong: (max: number) => `Up to ${max} characters fit in this date range`,
    textUnsupported: 'Letters, digits and . , : - _ + = * ! ? ( ) / @ # only',
    imageInvert: 'Invert (light areas become commits)',
    imageThreshold: 'Cut-off',
    imageChoose: 'Choose an image…',
    imageHint: 'Sampled locally. High-contrast shapes work best.',
    imageApply: 'Place image',
    less: 'Less',
    more: 'More',
    weekdayShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    monthShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    levelLabels: ['No commits', 'Light', 'Moderate', 'Active', 'Heavy'],
    statActiveDays: 'active days',
    statCommits: 'commits',
    statSpan: 'day span',
    commitsOnDate: (count: number) => `${count} commit${count === 1 ? '' : 's'}`,
    noCommitsOnDate: 'No commits',

    // settings
    repository: 'Repository URL',
    repositoryPlaceholder: 'https://github.com/you/your-repo.git',
    repositoryHint: 'HTTPS or SSH',
    repositoryRequired: 'A repository URL is required',
    repositoryInvalid: 'Doesn’t look like a github.com repository URL',
    branch: 'Branch',
    branchInvalid: 'Not a valid Git branch name',
    branchWarning: 'Commits usually only count on the default branch or gh-pages',
    dateRange: 'Date range',
    lastYear: 'Last 365 days',
    lastSixMonths: 'Last 6 months',
    thisYear: 'This year',
    startDate: 'Start',
    endDate: 'End',
    dateOrderInvalid: 'The end date must not be before the start date',
    dateTooLong: 'GitHub’s graph shows about a year — keep it under 366 days',
    intensity: 'Commits per shade',
    intensityHint: 'Shade 1 → shade 4',
    intensityInvalid: 'Needs 1 ≤ min ≤ max ≤ 20',
    min: 'Min',
    max: 'Max',
    timezone: 'Timezone',
    timezoneDetected: 'detected',
    identity: 'Commit identity',
    authorName: 'Author name',
    authorEmail: 'Author email',
    identityHint: 'Leave blank to use this machine’s Git config',
    emailWarning: 'Must be an email verified on your GitHub account',
    commitPrefix: 'Commit message',
    commitPrefixHint: 'Dates are appended automatically',
    skipExisting: 'Skip days that already have commits',
    skipExistingHint: 'Safe to run the script more than once',
    confirmPush: 'Ask before pushing',
    confirmPushHint: 'Prompts y/N in the terminal',
    reset: 'Reset everything',
    resetConfirm: 'Discard your drawing and settings?',

    // export
    copy: 'Copy script',
    copied: 'Copied',
    download: 'Download .sh',
    downloaded: 'Downloaded',
    blockedTitle: 'Fill in the highlighted fields to export',
    readyTitle: (commits: number, days: number) =>
      `${commits.toLocaleString()} commits across ${days.toLocaleString()} days`,
    emptyTitle: 'Nothing drawn yet — paint some cells first',
    runIt: 'Then run',
    scriptLines: (count: number) => `${count} lines`,
    authNote:
      'No password or token is stored. The push uses your existing Git credentials — run gh auth login first if you need to.',
    criteriaTitle: 'GitHub only counts a commit when',
    criteria: [
      'the author email is verified on your account',
      'the repository is not a fork',
      'the commit is on the default branch or gh-pages',
    ],
    honesty: 'Backfilled commits do not represent real work. Use this on your own repositories, and be honest about it.',
    footer: 'Local-first. No uploads, no accounts, no tracking.',
    profileLink: 'Built by zuyu-ultra',
    sourceLink: 'Source',
  },

  zh: {
    appName: 'Kusa 种草',
    appTagline: '画一张 GitHub 贡献图，导出一份看得懂的脚本。',
    localOnly: '全部在浏览器本地运行',
    docsLink: 'GitHub 贡献计入规则',
    themeLabel: '切换配色',
    languageLabel: '语言',

    stepDraw: '绘制',
    stepConfigure: '配置',
    stepExport: '导出',
    stepDrawHint: '在网格上点击或拖动，也可以从模板开始。',
    stepConfigureHint: '告诉脚本要写入哪个仓库。',
    stepExportHint: '读一遍，下载，运行。',

    brush: '画笔',
    brushHint: '拖动涂抹 · 按住 Alt 擦除',
    undo: '撤销',
    redo: '重做',
    patterns: '模板',
    natural: '自然',
    dense: '高密',
    weekday: '工作日',
    wave: '波浪',
    ramp: '渐强',
    clear: '清空',
    textTool: '文字',
    imageTool: '图片',
    textPlaceholder: 'HELLO',
    textIntensity: '深浅',
    textPosition: '位置',
    textApply: '放置文字',
    textCancel: '取消',
    textTooLong: (max: number) => `当前日期范围最多容纳 ${max} 个字符`,
    textUnsupported: '仅支持字母、数字和 . , : - _ + = * ! ? ( ) / @ #',
    imageInvert: '反相（亮部生成提交）',
    imageThreshold: '阈值',
    imageChoose: '选择图片…',
    imageHint: '仅在本地采样。高对比度的图形效果最好。',
    imageApply: '放置图片',
    less: '少',
    more: '多',
    weekdayShort: ['日', '一', '二', '三', '四', '五', '六'],
    monthShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    levelLabels: ['无提交', '少量', '适中', '活跃', '密集'],
    statActiveDays: '活跃天数',
    statCommits: '提交数',
    statSpan: '覆盖天数',
    commitsOnDate: (count: number) => `${count} 次提交`,
    noCommitsOnDate: '无提交',

    repository: '仓库地址',
    repositoryPlaceholder: 'https://github.com/你/你的仓库.git',
    repositoryHint: 'HTTPS 或 SSH',
    repositoryRequired: '请填写仓库地址',
    repositoryInvalid: '这不像一个 github.com 仓库地址',
    branch: '分支',
    branchInvalid: '不是合法的 Git 分支名',
    branchWarning: '通常只有默认分支或 gh-pages 上的提交才会计入',
    dateRange: '日期范围',
    lastYear: '最近 365 天',
    lastSixMonths: '最近 6 个月',
    thisYear: '今年',
    startDate: '开始',
    endDate: '结束',
    dateOrderInvalid: '结束日期不能早于开始日期',
    dateTooLong: 'GitHub 贡献图约显示一年，请控制在 366 天以内',
    intensity: '每档深浅对应的提交数',
    intensityHint: '第 1 档 → 第 4 档',
    intensityInvalid: '需满足 1 ≤ 最小值 ≤ 最大值 ≤ 20',
    min: '最小',
    max: '最大',
    timezone: '时区',
    timezoneDetected: '已自动识别',
    identity: '提交身份',
    authorName: '作者名称',
    authorEmail: '作者邮箱',
    identityHint: '留空则读取本机 Git 配置',
    emailWarning: '必须是你 GitHub 账号中已验证的邮箱',
    commitPrefix: '提交信息',
    commitPrefixHint: '日期会自动追加在后面',
    skipExisting: '跳过已有提交的日期',
    skipExistingHint: '脚本可以重复运行而不重复补充',
    confirmPush: '推送前询问',
    confirmPushHint: '在终端显示 y/N 确认',
    reset: '全部重置',
    resetConfirm: '确定要丢弃当前的绘制和配置吗？',

    copy: '复制脚本',
    copied: '已复制',
    download: '下载 .sh',
    downloaded: '已下载',
    blockedTitle: '补全标记的字段后即可导出',
    readyTitle: (commits: number, days: number) =>
      `${days.toLocaleString()} 天内共 ${commits.toLocaleString()} 次提交`,
    emptyTitle: '还没有画任何内容 —— 先在网格上涂几笔',
    runIt: '然后运行',
    scriptLines: (count: number) => `${count} 行`,
    authNote:
      '脚本不保存任何密码或 Token。推送使用你本机已有的 Git 凭据 —— 如未登录，先执行 gh auth login。',
    criteriaTitle: 'GitHub 计入一次提交，需要同时满足',
    criteria: [
      '作者邮箱已在你的账号中验证',
      '仓库不是 fork',
      '提交位于默认分支或 gh-pages',
    ],
    honesty: '补写的提交并不代表真实工作量。请只在自己的仓库上使用，并如实说明。',
    footer: '本地优先。不上传、不注册、不追踪。',
    profileLink: '由 zuyu-ultra 制作',
    sourceLink: '源码',
  },
}

export function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.languages?.some((tag) => tag.toLowerCase().startsWith('zh')) ? 'zh' : 'en'
}
