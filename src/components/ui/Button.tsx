import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'
import './Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  icon?: IconName
  iconRight?: IconName
  /** Stretch to the container width. */
  block?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  block = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    block ? 'btn--block' : '',
    !children ? 'btn--icon-only' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 16} />}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  /** Required: an icon-only control needs an accessible name. */
  label: string
  variant?: ButtonVariant
  size?: 'sm' | 'md'
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, 'btn--icon-only', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size === 'sm' ? 15 : 17} />
    </button>
  )
}
