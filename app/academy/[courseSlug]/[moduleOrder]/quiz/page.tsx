'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Question {
  _key: string
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation?: string
}

interface QuizResult {
  allCorrect: boolean
  results?: { correct: boolean; correctAnswer: string; explanation?: string }[]
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const [academyModule, setAcademyModule] = useState<{
    _id: string; title: string; questionsToShow: number
    quizQuestionBank: Question[]
  } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/academy/me').then(r => r.json())
      if (!meRes.authenticated) { router.push(`/academy/${params.courseSlug}`); return }

      const courseRes = await fetch(`/api/academy/course/${params.courseSlug}`).then(r => r.json())
      const mod = courseRes.course?.modules?.find((m: { order: number }) => m.order === Number(params.moduleOrder))
      if (!mod) { router.push(`/academy/${params.courseSlug}`); return }

      const modRes = await fetch(`/api/academy/module/${mod._id}`).then(r => r.json())
      setAcademyModule(modRes.module)

      const bank = [...(modRes.module?.quizQuestionBank || [])] as Question[]
      const toShow = modRes.module?.questionsToShow || 3
      const shuffled = bank.sort(() => Math.random() - 0.5).slice(0, toShow)
      setQuestions(shuffled)
      setLoading(false)
    }
    load()
  }, [params, router])

  async function handleSubmit() {
    if (!academyModule || Object.keys(answers).length < questions.length) return
    setSubmitting(true)
    const res = await fetch('/api/academy/quiz-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId: academyModule._id,
        answers: Object.entries(answers).map(([questionId, selected]) => ({ questionId, selected })),
      }),
    })
    const data = await res.json()
    setResults(data)
    setSubmitting(false)
    if (data.allCorrect) {
      setTimeout(() => router.push(`/academy/${params.courseSlug}/${params.moduleOrder}/complete`), 1500)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"
    style={{ background: '#FAF8F5', color: '#5F5E5A' }}>Loading quiz...</div>

  return (
    <main style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-xs mb-2 tracking-widest" style={{ color: '#633806' }}>MINI QUIZ</p>
        <h1 className="text-2xl mb-6" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
          {academyModule?.title}
        </h1>

        {questions.map((q, idx) => (
          <div key={q._key} className="mb-8 pb-8 border-b" style={{ borderColor: '#D3D1C7' }}>
            <p className="font-medium mb-4 text-sm" style={{ color: '#2C2C2A' }}>
              {idx + 1}. {q.questionText}
            </p>
            {(['A', 'B', 'C', 'D'] as const).map(letter => (
              <button key={letter}
                onClick={() => !results && setAnswers(prev => ({ ...prev, [q._key]: letter }))}
                className="w-full text-left px-4 py-2.5 rounded border text-sm mb-2"
                style={{
                  borderColor: answers[q._key] === letter ? '#633806' : '#D3D1C7',
                  background: answers[q._key] === letter ? '#FAEEDA' : '#FFFFFF',
                  color: '#2C2C2A',
                }}>
                {letter}. {q[`option${letter}`]}
              </button>
            ))}
            {results && (
              <div className="mt-3 p-3 rounded text-xs"
                style={{ background: results.results?.[idx]?.correct ? '#E1F5EE' : '#FCEBEB',
                  color: results.results?.[idx]?.correct ? '#085041' : '#A32D2D' }}>
                {results.results?.[idx]?.correct ? 'Correct' : `Incorrect — correct answer is ${results.results?.[idx]?.correctAnswer}`}
                {results.results?.[idx]?.explanation && (
                  <p className="mt-1">{results.results?.[idx]?.explanation}</p>
                )}
              </div>
            )}
          </div>
        ))}

        {!results && (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length || submitting}
            className="w-full py-3 rounded font-medium"
            style={{ background: '#633806', color: '#FAEEDA',
              opacity: Object.keys(answers).length < questions.length ? 0.5 : 1 }}>
            {submitting ? 'Checking...' : 'Submit answers'}
          </button>
        )}

        {results && !results.allCorrect && (
          <div className="mt-6 text-center">
            <p className="text-sm mb-4" style={{ color: '#5F5E5A' }}>
              Not all answers were correct. Try again with a new set of questions.
            </p>
            <button onClick={() => {
              setResults(null); setAnswers({})
              const bank = [...(academyModule?.quizQuestionBank || [])] as Question[]
              const toShow = academyModule?.questionsToShow || 3
              setQuestions(bank.sort(() => Math.random() - 0.5).slice(0, toShow))
            }}
              className="px-6 py-2 rounded text-sm"
              style={{ background: '#1D9E75', color: '#fff' }}>
              Try again
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
