import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import type { Copy } from '../i18n'
import { TIMEZONES, daysAgo, localTimezoneOffset, startOfYear, today } from '../lib/date'
import { countPerLevel } from '../lib/heatmap'
import type { Settings as SettingsValue, Validation } from '../lib/settings'

interface Props {
  copy: Copy
  value: SettingsValue
  onChange: (patch: Partial<SettingsValue>) => void
  validation: Validation
  onReset: () => void
}

export function SettingsPanel({ copy, value, onChange, validation, onReset }: Props) {
  const [touchedRepository, setTouchedRepository] = useState(false)
  const localOffset = localTimezoneOffset()

  const repositoryError = touchedRepository && validation.repository !== 'ok'
    ? validation.repository === 'empty' ? copy.repositoryRequired : copy.repositoryInvalid
    : validation.repository === 'invalid' ? copy.repositoryInvalid : ''

  const branchWarning = validation.branch
    && !['main', 'master', 'gh-pages'].includes(value.branch.trim())

  const ranges: Array<[string, string, string]> = [
    [copy.lastYear, daysAgo(364), today()],
    [copy.lastSixMonths, daysAgo(181), today()],
    [copy.thisYear, startOfYear(), today()],
  ]

  const perLevel = countPerLevel(value.minCommits, value.maxCommits)

  return (
    <div className="settings">
      <div className="field span-2">
        <label htmlFor="repository">
          {copy.repository}
          <em>{copy.repositoryHint}</em>
        </label>
        <input
          id="repository"
          className={`text-input mono${repositoryError ? ' invalid' : ''}`}
          value={value.repository}
          spellCheck={false}
          autoComplete="off"
          placeholder={copy.repositoryPlaceholder}
          onChange={(event) => onChange({ repository: event.target.value })}
          onBlur={() => setTouchedRepository(true)}
        />
        {repositoryError && <p className="error">{repositoryError}</p>}
      </div>

      <div className="field">
        <label htmlFor="branch">{copy.branch}</label>
        <input
          id="branch"
          className={`text-input mono${validation.branch ? '' : ' invalid'}`}
          value={value.branch}
          spellCheck={false}
          onChange={(event) => onChange({ branch: event.target.value })}
        />
        {!validation.branch && <p className="error">{copy.branchInvalid}</p>}
        {branchWarning && <p className="warning"><AlertTriangle size={13} />{copy.branchWarning}</p>}
      </div>

      <div className="field span-3">
        <label>{copy.dateRange}</label>
        <div className="date-row">
          <input
            className="text-input mono"
            type="date"
            aria-label={copy.startDate}
            value={value.start}
            onChange={(event) => onChange({ start: event.target.value })}
          />
          <span className="dash">–</span>
          <input
            className="text-input mono"
            type="date"
            aria-label={copy.endDate}
            value={value.end}
            onChange={(event) => onChange({ end: event.target.value })}
          />
          <div className="quick-ranges">
            {ranges.map(([label, start, end]) => (
              <button
                key={label}
                type="button"
                className={`chip${value.start === start && value.end === end ? ' active' : ''}`}
                onClick={() => onChange({ start, end })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {!validation.dateOrder && <p className="error">{copy.dateOrderInvalid}</p>}
        {validation.dateOrder && !validation.dateLength && <p className="error">{copy.dateTooLong}</p>}
      </div>

      <div className="field span-2">
        <label>
          {copy.intensity}
          <em>{copy.intensityHint}</em>
        </label>
        <div className="intensity-row">
          <label className="stepper">
            <span>{copy.min}</span>
            <input
              type="number" min={1} max={20} value={value.minCommits}
              onChange={(event) => onChange({ minCommits: Number(event.target.value) })}
            />
          </label>
          <label className="stepper">
            <span>{copy.max}</span>
            <input
              type="number" min={1} max={20} value={value.maxCommits}
              onChange={(event) => onChange({ maxCommits: Number(event.target.value) })}
            />
          </label>
          <p className="mapping" aria-live="polite">
            {validation.intensity ? perLevel.map((count, index) => (
              <span key={index}><i data-level={index + 1} />{count}</span>
            )) : null}
          </p>
        </div>
        {!validation.intensity && <p className="error">{copy.intensityInvalid}</p>}
      </div>

      <div className="field">
        <label htmlFor="timezone">
          {copy.timezone}
          {value.timezone === localOffset && <em>{copy.timezoneDetected}</em>}
        </label>
        <select
          id="timezone"
          className="text-input mono"
          value={value.timezone}
          onChange={(event) => onChange({ timezone: event.target.value })}
        >
          {TIMEZONES.map((zone) => <option key={zone} value={zone}>UTC{zone}</option>)}
        </select>
      </div>

      <div className="field span-3 divider">
        <label>{copy.identity}<em>{copy.identityHint}</em></label>
        <div className="identity-row">
          <input
            className="text-input"
            aria-label={copy.authorName}
            placeholder={copy.authorName}
            value={value.authorName}
            onChange={(event) => onChange({ authorName: event.target.value })}
          />
          <input
            className="text-input"
            type="email"
            aria-label={copy.authorEmail}
            placeholder={copy.authorEmail}
            value={value.authorEmail}
            onChange={(event) => onChange({ authorEmail: event.target.value })}
          />
          <input
            className="text-input"
            aria-label={copy.commitPrefix}
            placeholder={copy.commitPrefix}
            title={copy.commitPrefixHint}
            value={value.commitPrefix}
            onChange={(event) => onChange({ commitPrefix: event.target.value })}
          />
        </div>
      </div>

      <div className="field span-3 toggles">
        <label className="toggle">
          <input
            type="checkbox"
            checked={value.skipExisting}
            onChange={(event) => onChange({ skipExisting: event.target.checked })}
          />
          <i aria-hidden="true" />
          <div><strong>{copy.skipExisting}</strong><span>{copy.skipExistingHint}</span></div>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={value.confirmPush}
            onChange={(event) => onChange({ confirmPush: event.target.checked })}
          />
          <i aria-hidden="true" />
          <div><strong>{copy.confirmPush}</strong><span>{copy.confirmPushHint}</span></div>
        </label>
        <button type="button" className="chip subtle with-icon" onClick={onReset}>
          <RotateCcw size={13} /> {copy.reset}
        </button>
      </div>
    </div>
  )
}
