import { useId, useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, X } from 'lucide-react'
import { IconButton, Spinner } from '../ui'
import { ImagePresets, processImage } from '../../lib/imageUtils'
import { cn } from '../../lib/utils'

const MAX_BYTES = 10 * 1024 * 1024

interface ImageDropProps {
  label: string
  value: string | null
  /** Receives the resized image as a data URL; return a URL to show instead (e.g. after uploading). */
  onFile: (dataUrl: string) => Promise<string | void> | string | void
  onRemove?: () => void
  preset?: keyof typeof ImagePresets
  aspect?: 'square' | 'wide'
}

/** Click-or-drop image picker that resizes in the browser before upload. */
export function ImageDrop({ label, value, onFile, onRemove, preset = 'product', aspect = 'square' }: ImageDropProps) {
  const { t } = useTranslation()
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const handle = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError(t('dash.notImage'))
    if (file.size > MAX_BYTES) return setError(t('dash.tooLarge'))
    setError('')
    setBusy(true)
    try {
      await onFile(await processImage(file, ImagePresets[preset]))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    handle(event.dataTransfer.files[0])
  }

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div
        onDragOver={event => { event.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative overflow-hidden rounded-lg border-2 border-dashed bg-surface-muted transition-colors',
          aspect === 'square' ? 'aspect-square max-w-48' : 'aspect-[3/1]',
          dragging ? 'border-primary bg-primary-soft' : 'border-border-strong',
        )}
      >
        {value && <img src={value} alt="" className="absolute inset-0 size-full object-cover" />}
        <label
          htmlFor={id}
          className={cn(
            'absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 p-3 text-center text-sm text-fg-muted transition-opacity',
            value && 'bg-fg/50 text-bg opacity-0 hover:opacity-100 focus-within:opacity-100',
          )}
        >
          {busy ? <Spinner /> : <ImagePlus aria-hidden className="size-6" />}
          <span className="font-medium">{busy ? t('dash.uploading') : value ? t('dash.replaceImage') : t('dash.dropImage')}</span>
          <input ref={input} id={id} type="file" accept="image/*" className="sr-only" onChange={event => handle(event.target.files?.[0])} disabled={busy} />
        </label>
        {value && onRemove && !busy && (
          <IconButton label={t('dash.removeImage')} icon={<X />} size="icon-sm" className="absolute end-2 top-2 bg-surface/90 shadow-sm" onClick={onRemove} />
        )}
      </div>
      {error ? <p role="alert" className="text-xs font-medium text-danger">{error}</p> : <p className="text-xs text-fg-subtle">{t('dash.imageHint')}</p>}
    </div>
  )
}
