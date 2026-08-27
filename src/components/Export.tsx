import { AlertTriangle, Check, Clipboard, Download, KeyRound, ShieldCheck } from 'lucide-react'
import type { Copy } from '../i18n'

interface Props {
  copy: Copy
  script: string
  ready: boolean
  hasDrawing: boolean
  commits: number
  activeDays: number
  copied: boolean
  downloaded: boolean
  onCopy: () => void
  onDownload: () => void
}

export function Export({
  copy, script, ready, hasDrawing, commits, activeDays, copied, downloaded, onCopy, onDownload,
}: Props) {
  const exportable = ready && hasDrawing
  const status = !ready ? copy.blockedTitle : !hasDrawing ? copy.emptyTitle : copy.readyTitle(commits, activeDays)

  return (
    <div className="export">
      <div className={`export-bar${exportable ? ' ready' : ''}`}>
        <span className="export-status">
          {exportable ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
          {status}
        </span>
        <div className="export-actions">
          <button type="button" className="button" onClick={onCopy} disabled={!exportable}>
            {copied ? <Check size={15} /> : <Clipboard size={15} />}
            {copied ? copy.copied : copy.copy}
          </button>
          <button type="button" className="button primary" onClick={onDownload} disabled={!exportable}>
            {downloaded ? <Check size={15} /> : <Download size={15} />}
            {downloaded ? copy.downloaded : copy.download}
          </button>
        </div>
      </div>

      <div className="script-box">
        <div className="script-head">
          <span className="filename">generate-contributions.sh</span>
          <span className="script-lines">{copy.scriptLines(script.split('\n').length)}</span>
        </div>
        <pre><code>{script}</code></pre>
      </div>

      <div className="run-line">
        <span>{copy.runIt}</span>
        <code>chmod +x generate-contributions.sh &amp;&amp; ./generate-contributions.sh</code>
      </div>

      <div className="notes">
        <p className="note"><KeyRound size={15} />{copy.authNote}</p>
        <div className="note criteria">
          <ShieldCheck size={15} />
          <div>
            <strong>{copy.criteriaTitle}</strong>
            <ul>{copy.criteria.map((line) => <li key={line}>{line}</li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  )
}
