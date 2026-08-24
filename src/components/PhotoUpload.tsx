import { useRef, useState } from 'react'

interface Props {
  label: string
  onImage: (base64: string, mimeType: string) => void
}

export function PhotoUpload({ label, onImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [anteprima, setAnteprima] = useState<string | null>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const risultato = reader.result as string
      setAnteprima(risultato)
      const base64 = risultato.split(',')[1]
      onImage(base64, file.type)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="photo-upload">
      <button type="button" onClick={() => inputRef.current?.click()}>
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      {anteprima && <img src={anteprima} alt="anteprima" className="anteprima" />}
    </div>
  )
}
