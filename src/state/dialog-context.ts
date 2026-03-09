import { createContext } from 'react'

export interface AlertOptions {
    title: string
    description?: string
    confirmText?: string
}

export interface ConfirmOptions extends AlertOptions {
    cancelText?: string
    tone?: 'default' | 'danger'
}

export interface PromptOptions extends ConfirmOptions {
    placeholder?: string
    initialValue?: string
    inputLabel?: string
    validate?: (value: string) => string | undefined
}

export interface DialogContextValue {
    alert: (options: AlertOptions) => Promise<void>
    confirm: (options: ConfirmOptions) => Promise<boolean>
    prompt: (options: PromptOptions) => Promise<string | null>
}

export const DialogContext = createContext<DialogContextValue | null>(null)
