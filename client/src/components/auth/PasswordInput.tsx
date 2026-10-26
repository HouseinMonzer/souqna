import { forwardRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { IconButton, Input, type InputProps } from '../ui'
import { passwordScore } from '../../lib/password'

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'endSlot'>>(function PasswordInput(props, ref) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      dir="ltr"
      endSlot={
        <IconButton
          label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          icon={visible ? <EyeOff /> : <Eye />}
          size="icon-sm"
          onClick={() => setVisible(v => !v)}
        />
      }
      {...props}
    />
  )
})

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation()
  const score = passwordScore(password)
  if (!password) return null
  const levels = ['strengthWeak', 'strengthWeak', 'strengthFair', 'strengthGood', 'strengthStrong']
  const colors = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-success']
  return (
    <div className="grid gap-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1" aria-hidden>
        {[1, 2, 3, 4].map(i => <span key={i} className={`h-1 rounded-full ${i <= score ? colors[score] : 'bg-border'}`} />)}
      </div>
      <span className="text-xs text-fg-muted">{t('auth.strength', { level: t(`auth.${levels[score]}`) })}</span>
    </div>
  )
}
