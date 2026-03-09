import type { ReactNode } from 'react'
import './PageState.css'

interface PageStateProps {
    title: string
    description?: string
    icon?: ReactNode
    action?: ReactNode
    compact?: boolean
}

export default function PageState({ title, description, icon, action, compact = false }: PageStateProps) {
    return (
        <div className={`page-state ${compact ? 'compact' : ''}`}>
            {icon ? <div className="page-state-icon">{icon}</div> : null}
            <h3 className="page-state-title">{title}</h3>
            {description ? <p className="page-state-description">{description}</p> : null}
            {action ? <div className="page-state-action">{action}</div> : null}
        </div>
    )
}
