'use client'
import { useState, useMemo } from 'react'

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

interface Props {
  type: string
  content: string
  onComplete: () => void
}

interface Option { label: string; value: string }
interface InteractiveData {
  prompt?: string
  question?: string
  options?: Option[]
  correctAnswer?: string
  explanation?: string
}

function parseContent(content: string): InteractiveData | null {
  try { return JSON.parse(content) } catch { return null }
}

export default function InteractiveElement({ type, content, onComplete }: Props) {
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [reflection, setReflection] = useState('')
  const [reflectionSent, setReflectionSent] = useState(false)

  const data = parseContent(content)

  const shuffledOptions = useMemo(() => {
    if (!data?.options || type !== 'sort') return data?.options
    return shuffleArray(data.options)
  }, [data?.question, data?.options, type])

  if (!data) return null

  const boxStyle = {
    background: '#E1F5EE',
    borderRadius: '8px',
    padding: '1.25rem',
    marginTop: '1.5rem',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    letterSpacing: '1.5px',
    color: '#085041',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: '0.75rem',
  }

  if (type === 'reflection') {
    return (
      <div style={boxStyle}>
        <p style={labelStyle}>Reflection</p>
        <p className="text-sm mb-3" style={{ color: '#085041' }}>{data.prompt}</p>
        {!reflectionSent ? (
          <>
            <textarea value={reflection} onChange={e => setReflection(e.target.value)}
              rows={4} placeholder="Write your thoughts here..."
              className="w-full px-3 py-2 text-sm rounded border outline-none resize-none"
              style={{ borderColor: '#9FE1CB', background: '#FFFFFF', color: '#2C2C2A' }} />
            <button onClick={async () => {
              if (!reflection.trim()) return
              await fetch('/api/academy/reflection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  reflection,
                  lessonTitle: document.title,
                  moduleTitle: '',
                }),
              })
              onComplete()
              setReflectionSent(true)
            }}
              disabled={!reflection.trim()}
              className="mt-3 px-4 py-2 rounded text-sm"
              style={{ background: '#1D9E75', color: '#fff', opacity: reflection.trim() ? 1 : 0.5 }}>
              Save reflection
            </button>
          </>
        ) : (
          <div className="p-4 rounded text-sm" style={{ background: '#c8f0e0', color: '#085041' }}>
            <p className="font-medium mb-1">Reflection saved.</p>
            <p>A copy has been sent to your email. Your reflection may also be used to initiate a conversation with Subramaniam P G.</p>
          </div>
        )}
      </div>
    )
  }

  const labelMap: Record<string, string> = {
    'true-false': 'True or false',
    'spot-mistake': 'Spot the mistake',
    'fill-blank': 'Fill in the blank',
    'sort': 'Pick the correct one',
  }

  return (
    <div style={boxStyle}>
      <p style={labelStyle}>{labelMap[type] || 'Quick check'}</p>
      <div className="mb-4">
        {data.question?.split('\n').map((line: string, idx: number) => (
          line.trim() === '' ? (
            <div key={idx} className="h-2" />
          ) : (
            <p key={idx} className="text-sm"
              style={{
                color: '#085041',
                fontWeight: line.startsWith('Objective') || line.startsWith('KR') ? 500 : 600,
                fontFamily: line.startsWith('Objective') || line.startsWith('KR') ? 'monospace' : 'inherit',
                marginBottom: '4px',
                background: line.startsWith('Objective') || line.startsWith('KR') ? '#FFFFFF' : 'transparent',
                padding: line.startsWith('Objective') || line.startsWith('KR') ? '2px 6px' : '0',
                borderRadius: '3px',
              }}>
              {line}
            </p>
          )
        ))}
      </div>
      <div className="space-y-2">
        {shuffledOptions?.map((opt, i) => {
          const isCorrect = opt.value === data.correctAnswer
          const isSelected = selected === opt.value
          const lines = opt.label.split(/\n|—/).map((l: string) => l.trim()).filter(Boolean)
          return (
            <button key={i}
              onClick={() => {
                if (answered) return
                setSelected(opt.value)
                setAnswered(true)
                if (isCorrect) onComplete()
              }}
              className="w-full text-left px-4 py-3 rounded border text-sm mb-2"
              style={{
                borderColor: answered
                  ? isCorrect ? '#1D9E75' : isSelected ? '#E24B4A' : '#D3D1C7'
                  : '#9FE1CB',
                background: answered
                  ? isCorrect ? '#E1F5EE' : isSelected ? '#FCEBEB' : '#FFFFFF'
                  : '#FFFFFF',
                color: '#2C2C2A',
              }}>
              {lines.map((line: string, idx: number) => (
                <span key={idx} className="block"
                  style={{
                    fontWeight: idx === 0 ? 500 : 400,
                    color: idx === 0 ? '#2C2C2A' : '#5F5E5A',
                    marginTop: idx > 0 ? '4px' : 0,
                  }}>
                  {line}
                </span>
              ))}
            </button>
          )
        })}
      </div>
      {answered && data.explanation && (
        <p className="text-xs mt-4 p-3 rounded" style={{ background: '#FAEEDA', color: '#633806' }}>
          {data.explanation}
        </p>
      )}
    </div>
  )
}
