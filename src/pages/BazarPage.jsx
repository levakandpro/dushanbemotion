import React from 'react'
import { ToastProvider } from '../editorV2/context/ToastContext'
import BazarPageShell from '../editorV2/components/bazar/BazarPageShell'

export default function BazarPage() {
  return (
    <ToastProvider>
      <BazarPageShell />
    </ToastProvider>
  )
}

