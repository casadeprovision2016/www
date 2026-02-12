'use client'

import { useState } from 'react'
import { Button } from '@/components/button'
import { Copy } from 'lucide-react'

interface CopyToClipboardButtonProps {
  text: string
}

export default function CopyToClipboardButton({ text }: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="p-1"
        aria-label="Copiar al portapapeles"
      >
        <Copy className="h-4 w-4" />
      </Button>
      {copied && <span className="text-green-600 text-xs">¡Copiado!</span>}
    </div>
  )
}
