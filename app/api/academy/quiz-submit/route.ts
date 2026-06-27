import { NextRequest, NextResponse } from 'next/server'
import { sanityClient } from '@/lib/academy'

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('academy_session')?.value
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { moduleId, answers } = await req.json()
    // answers: [{ questionId: string, selected: 'A'|'B'|'C'|'D' }]

    const academyModule = await sanityClient.fetch(
      `*[_type == 'academyModule' && _id == $moduleId][0]{ quizQuestionBank }`,
      { moduleId }
    )

    if (!academyModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    let totalPoints = 0
    let allCorrect = true
    const results = answers.map((answer: { questionId: string; selected: string }) => {
      const question = academyModule.quizQuestionBank.find(
        (q: { _key: string; correctAnswer: string; points?: number; explanation?: string }) => q._key === answer.questionId
      )
      if (!question) return { questionId: answer.questionId, correct: false }
      const correct = question.correctAnswer === answer.selected
      if (!correct) allCorrect = false
      if (correct) totalPoints += (question.points || 10)
      return {
        questionId: answer.questionId,
        correct,
        explanation: question.explanation,
        correctAnswer: question.correctAnswer,
      }
    })

    if (allCorrect) {
      await sanityClient.patch(sessionId)
        .inc({ pointsTotal: totalPoints })
        .commit()
    }

    return NextResponse.json({
      success: true,
      allCorrect,
      totalPoints,
      results,
    })
  } catch (error) {
    console.error('Quiz submit error:', error)
    return NextResponse.json({ error: 'Quiz submission failed' }, { status: 500 })
  }
}
