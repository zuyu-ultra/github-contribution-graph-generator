import { Dices, Eraser, Image as ImageIcon, Redo2, Trash2, Type, Undo2 } from 'lucide-react'
import { useRef } from 'react'
import type { Copy } from '../i18n'
import type { Level, Pattern } from '../lib/heatmap'
import { LEVEL_COLORS } from '../lib/heatmap'

export type Draft =
  | { kind: 'text'; text: string; level: Level; offset: number }
  | { kind: 'image'; name: string; invert: boolean; threshold: number }

interface Props {
  copy: Copy
  theme: 'light' | 'dark'
  brush: Level
  onBrush: (level: Level) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onPattern: (pattern: Pattern) => void
  onRandomize: () => void
  draft: Draft | null
  onDraftChange: (draft: Draft) => void
  onOpenText: () => void
  onPickImage: (file: File) => void
  onCommitDraft: () => void
  onCancelDraft: () => void
  maxCharacters: number
  maxOffset: number
  textRejected: boolean
}

const PATTERNS: Array<[Pattern, keyof Copy]> = [
  ['natural', 'natural'],
  ['dense', 'dense'],
  ['weekday', 'weekday'],
  ['wave', 'wave'],
  ['ramp', 'ramp'],
]

export function Toolbar({
  copy, theme, brush, onBrush, canUndo, canRedo, onUndo, onRedo, onPattern, onRandomize,
  draft, onDraftChange, onOpenText, onPickImage, onCommitDraft, onCancelDraft,
  maxCharacters, maxOffset, textRejected,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const colors = LEVEL_COLORS[theme]

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <div className="tool-group" role="group" aria-label={copy.brush}>
          <span className="tool-label">{copy.brush}</span>
          {colors.map((color, level) => (
            <button
              key={color}
              type="button"
              className={`swatch${brush === level ? ' selected' : ''}${level === 0 ? ' eraser' : ''}`}
              style={{ background: color }}
              aria-pressed={brush === level}
              aria-label={`${copy.brush}: ${copy.levelLabels[level]}`}
              title={`${copy.levelLabels[level]}  ·  ${level}`}
              onClick={() => onBrush(level as Level)}
            >
              {level === 0 && <Eraser size={11} />}
            </button>
          ))}
        </div>

        <div className="tool-group">
          <button type="button" className="icon-button" onClick={onUndo} disabled={!canUndo} title={`${copy.undo}  ⌘Z`}>
            <Undo2 size={15} /><span className="sr-only">{copy.undo}</span>
          </button>
          <button type="button" className="icon-button" onClick={onRedo} disabled={!canRedo} title={`${copy.redo}  ⇧⌘Z`}>
            <Redo2 size={15} /><span className="sr-only">{copy.redo}</span>
          </button>
        </div>

        <div className="tool-group wrap">
          <span className="tool-label">{copy.patterns}</span>
          {PATTERNS.map(([pattern, key]) => (
            <button key={pattern} type="button" className="chip" onClick={() => onPattern(pattern)}>
              {copy[key] as string}
            </button>
          ))}
          <button
            type="button"
            className="chip with-icon"
            onClick={onRandomize}
            title={`${copy.random}  ·  R`}
          >
            <Dices size={14} /> {copy.random}
          </button>
        </div>

        <div className="tool-group push-end">
          <button
            type="button"
            className={`chip with-icon${draft?.kind === 'text' ? ' active' : ''}`}
            onClick={onOpenText}
          >
            <Type size={14} /> {copy.textTool}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onPickImage(file)
              event.target.value = ''
            }}
          />
          <button
            type="button"
            className={`chip with-icon${draft?.kind === 'image' ? ' active' : ''}`}
            onClick={() => fileRef.current?.click()}
          >
            <ImageIcon size={14} /> {copy.imageTool}
          </button>
          <button type="button" className="chip danger with-icon" onClick={() => onPattern('clear')}>
            <Trash2 size={14} /> {copy.clear}
          </button>
        </div>
      </div>

      <p className="toolbar-hint">{copy.brushHint}</p>

      {draft?.kind === 'text' && (
        <div className="draft-panel">
          <label className="draft-field grow">
            <span>{copy.textTool}</span>
            <input
              autoFocus
              value={draft.text}
              maxLength={maxCharacters}
              placeholder={copy.textPlaceholder}
              onChange={(event) => onDraftChange({ ...draft, text: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onCommitDraft()
                if (event.key === 'Escape') onCancelDraft()
              }}
            />
          </label>

          <label className="draft-field">
            <span>{copy.textIntensity}</span>
            <div className="swatch-row">
              {colors.slice(1).map((color, index) => {
                const level = (index + 1) as Level
                return (
                  <button
                    key={color}
                    type="button"
                    className={`swatch${draft.level === level ? ' selected' : ''}`}
                    style={{ background: color }}
                    aria-label={copy.levelLabels[level]}
                    onClick={() => onDraftChange({ ...draft, level })}
                  />
                )
              })}
            </div>
          </label>

          <label className="draft-field">
            <span>{copy.textPosition}</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, maxOffset)}
              value={Math.min(draft.offset, Math.max(0, maxOffset))}
              onChange={(event) => onDraftChange({ ...draft, offset: Number(event.target.value) })}
            />
          </label>

          <div className="draft-actions">
            <button type="button" className="chip" onClick={onCancelDraft}>{copy.textCancel}</button>
            <button type="button" className="chip primary" onClick={onCommitDraft} disabled={!draft.text.trim()}>
              {copy.textApply}
            </button>
          </div>

          <p className="draft-note">
            {textRejected ? copy.textUnsupported : copy.textTooLong(maxCharacters)}
          </p>
        </div>
      )}

      {draft?.kind === 'image' && (
        <div className="draft-panel">
          <div className="draft-field grow">
            <span>{copy.imageTool}</span>
            <p className="draft-filename">{draft.name}</p>
          </div>

          <label className="draft-field checkbox">
            <input
              type="checkbox"
              checked={draft.invert}
              onChange={(event) => onDraftChange({ ...draft, invert: event.target.checked })}
            />
            <span>{copy.imageInvert}</span>
          </label>

          <label className="draft-field">
            <span>{copy.imageThreshold}</span>
            <input
              type="range"
              min={0}
              max={80}
              value={Math.round(draft.threshold * 100)}
              onChange={(event) => onDraftChange({ ...draft, threshold: Number(event.target.value) / 100 })}
            />
          </label>

          <div className="draft-actions">
            <button type="button" className="chip" onClick={onCancelDraft}>{copy.textCancel}</button>
            <button type="button" className="chip primary" onClick={onCommitDraft}>{copy.imageApply}</button>
          </div>

          <p className="draft-note">{copy.imageHint}</p>
        </div>
      )}
    </div>
  )
}
