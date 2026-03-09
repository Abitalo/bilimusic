import { useContext } from 'react'
import { AppStoreContext } from '../state/app-store-context'

export function useAppStore() {
    const context = useContext(AppStoreContext)
    if (!context) {
        throw new Error('useAppStore must be used within AppStoreProvider')
    }
    return context
}
