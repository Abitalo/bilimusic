import { useCallback, useMemo, useRef, useState } from 'react'
import type { FormEvent, PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'
import { DialogContext } from './dialog-context'
import type { AlertOptions, ConfirmOptions, PromptOptions } from './dialog-context'
import '../components/AppDialog.css'

type DialogValue = void | boolean | string | null
type DialogResolver = (value: DialogValue) => void

type DialogState =
    | { kind: 'alert'; options: AlertOptions }
    | { kind: 'confirm'; options: ConfirmOptions }
    | { kind: 'prompt'; options: PromptOptions }

export function DialogProvider({ children }: PropsWithChildren) {
    const resolverRef = useRef<DialogResolver | null>(null)
    const [dialog, setDialog] = useState<DialogState | null>(null)
    const [promptValue, setPromptValue] = useState('')
    const [promptError, setPromptError] = useState<string | null>(null)

    const closeDialog = useCallback((value: DialogValue) => {
        resolverRef.current?.(value)
        resolverRef.current = null
        setDialog(null)
        setPromptValue('')
        setPromptError(null)
    }, [])

    const alert = useCallback((options: AlertOptions) => {
        return new Promise<void>((resolve) => {
            resolverRef.current = () => resolve()
            setDialog({ kind: 'alert', options })
        })
    }, [])

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            resolverRef.current = (value) => resolve(Boolean(value))
            setDialog({ kind: 'confirm', options })
        })
    }, [])

    const prompt = useCallback((options: PromptOptions) => {
        return new Promise<string | null>((resolve) => {
            resolverRef.current = (value) => resolve(typeof value === 'string' ? value : null)
            setPromptValue(options.initialValue ?? '')
            setPromptError(null)
            setDialog({ kind: 'prompt', options })
        })
    }, [])

    const handlePromptSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!dialog || dialog.kind !== 'prompt') return

        const nextValue = promptValue.trim()
        const validationError = dialog.options.validate?.(nextValue)
        if (validationError) {
            setPromptError(validationError)
            return
        }

        closeDialog(nextValue)
    }, [closeDialog, dialog, promptValue])

    const value = useMemo(() => ({ alert, confirm, prompt }), [alert, confirm, prompt])

    const dialogNode = dialog ? createPortal(
        <div
            className="app-dialog-overlay"
            onClick={() => closeDialog(dialog.kind === 'alert' ? undefined : null)}
        >
            <div className="app-dialog-content" onClick={(event) => event.stopPropagation()}>
                <button
                    type="button"
                    className="app-dialog-close"
                    onClick={() => closeDialog(dialog.kind === 'alert' ? undefined : null)}
                >
                    ✕
                </button>
                <h2 className="app-dialog-title">{dialog.options.title}</h2>
                {dialog.options.description ? (
                    <p className="app-dialog-description">{dialog.options.description}</p>
                ) : null}

                {dialog.kind === 'prompt' ? (
                    <form className="app-dialog-form" onSubmit={handlePromptSubmit}>
                        <label className="app-dialog-label">
                            <span>{dialog.options.inputLabel ?? '名称'}</span>
                            <input
                                autoFocus
                                type="text"
                                className="app-dialog-input"
                                placeholder={dialog.options.placeholder}
                                value={promptValue}
                                onChange={(event) => {
                                    setPromptValue(event.target.value)
                                    if (promptError) {
                                        setPromptError(null)
                                    }
                                }}
                            />
                        </label>
                        {promptError ? <p className="app-dialog-error">{promptError}</p> : null}
                        <div className="app-dialog-actions">
                            <button
                                type="button"
                                className="app-dialog-btn secondary"
                                onClick={() => closeDialog(null)}
                            >
                                {dialog.options.cancelText ?? '取消'}
                            </button>
                            <button
                                type="submit"
                                className={`app-dialog-btn ${dialog.options.tone === 'danger' ? 'danger' : 'primary'}`}
                            >
                                {dialog.options.confirmText ?? '确认'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="app-dialog-actions">
                        {dialog.kind === 'confirm' ? (
                            <button
                                type="button"
                                className="app-dialog-btn secondary"
                                onClick={() => closeDialog(false)}
                            >
                                {dialog.options.cancelText ?? '取消'}
                            </button>
                        ) : null}
                        <button
                            type="button"
                            className={`app-dialog-btn ${dialog.kind === 'confirm' && dialog.options.tone === 'danger' ? 'danger' : 'primary'}`}
                            onClick={() => closeDialog(dialog.kind === 'confirm' ? true : undefined)}
                        >
                            {dialog.options.confirmText ?? '确定'}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    ) : null

    return (
        <DialogContext.Provider value={value}>
            {children}
            {dialogNode}
        </DialogContext.Provider>
    )
}
