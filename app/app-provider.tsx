'use client'

import { createContext, Dispatch, SetStateAction, useContext, useState } from 'react'
import { BrandingProvider } from '@/lib/contexts/BrandingContext'
import BrandingHead from '@/components/branding-head'

interface ContextProps {
  sidebarOpen: boolean
  setSidebarOpen: Dispatch<SetStateAction<boolean>>
  sidebarExpanded: boolean
  setSidebarExpanded: Dispatch<SetStateAction<boolean>>
}

const AppContext = createContext<ContextProps>({
  sidebarOpen: false,
  setSidebarOpen: (): boolean => false,
  sidebarExpanded: false,
  setSidebarExpanded: (): boolean => false
})

export default function AppProvider({
  children,
}: {
  children: React.ReactNode
}) {  
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false)
  return (
    <BrandingProvider>
      <BrandingHead />
      <AppContext.Provider value={{ sidebarOpen, setSidebarOpen, sidebarExpanded, setSidebarExpanded }}>
        {children}
      </AppContext.Provider>
    </BrandingProvider>
  )
}

export const useAppProvider = () => useContext(AppContext)