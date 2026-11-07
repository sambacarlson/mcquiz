import { useEffect, useState } from 'react'

type Question = {
  prompt: string
  options: string[]
  answer: number
  explanation?: string
}

type Quiz = {
  title: string
  description: string
  category: string
  questions: Question[]
}

type QuizResult = {
  selected: number
  correct: boolean
  revealed: boolean
}

const quizFiles = import.meta.glob<Quiz>('./quizzes/*.json', {
  eager: true,
  import: 'default',
})

const quizzes = Object.entries(quizFiles).map(([path, quiz]) => ({
  ...quiz,
  slug: path.split('/').pop()?.replace('.json', '') ?? path,
}))

function quizSlugFromPath() {
  return window.location.pathname.match(/^\/quiz\/([^/]+)\/?$/)?.[1] ?? null
}

function App() {
  const [activeSlug, setActiveSlug] = useState(quizSlugFromPath)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [results, setResults] = useState<QuizResult[]>([])
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const handlePopState = () => {
      setActiveSlug(quizSlugFromPath())
      setQuestionIndex(0)
      setSelectedOption(null)
      setResults([])
      setFinished(false)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const activeQuiz = quizzes.find((quiz) => quiz.slug === activeSlug)
  const currentQuestion = activeQuiz?.questions[questionIndex]
  const currentResult = results[questionIndex]

  function openQuiz(slug: string) {
    window.history.pushState(null, '', `/quiz/${slug}`)
    setActiveSlug(slug)
    setQuestionIndex(0)
    setSelectedOption(null)
    setResults([])
    setFinished(false)
  }

  function returnToQuizzes() {
    window.history.pushState(null, '', '/')
    setActiveSlug(null)
    setQuestionIndex(0)
    setSelectedOption(null)
    setResults([])
    setFinished(false)
  }

  function submitAnswer() {
    if (!activeQuiz || !currentQuestion || selectedOption === null) return

    setResults((previous) => {
      const next = [...previous]
      next[questionIndex] = {
        selected: selectedOption,
        correct: selectedOption === currentQuestion.answer,
        revealed: false,
      }
      return next
    })
  }

  function revealAnswer(index: number) {
    setResults((previous) =>
      previous.map((result, resultIndex) =>
        resultIndex === index ? { ...result, revealed: true } : result,
      ),
    )
  }

  function retryAnswer() {
    setResults((previous) => previous.filter((_, index) => index !== questionIndex))
    setSelectedOption(null)
  }

  function continueQuiz() {
    if (!activeQuiz) return
    if (questionIndex === activeQuiz.questions.length - 1) {
      setFinished(true)
      return
    }
    setQuestionIndex((index) => index + 1)
    setSelectedOption(null)
  }

  const score = results.filter((result) => result.correct).length
  const scorePercent = activeQuiz
    ? Math.round((score / activeQuiz.questions.length) * 100)
    : 0

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={returnToQuizzes}>
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M5 5.75A2.75 2.75 0 0 1 7.75 3H20v15H7.75A2.75 2.75 0 0 0 5 20.75v-15Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M5 6v14.75A2.25 2.25 0 0 1 7.25 18H20M9 7h7m-7 4h7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span>mcquiz</span>
        </button>
        <span className="topbar-note">A little knowledge goes a long way.</span>
      </header>

      <main className="main-content">
        {!activeSlug && (
          <section className="catalog">
            <div className="intro">
              <span className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT BRAIN BREAK</span>
              <h1>Curiosity looks<br />good on you.</h1>
              <p>Pick a quiz, take it one question at a time, and see what sticks.</p>
            </div>
            <div className="section-heading">
              <div>
                <h2>Choose a quiz</h2>
                <p>{quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'} ready when you are</p>
              </div>
              <span className="count-pill">{String(quizzes.length).padStart(2, '0')}</span>
            </div>
            {quizzes.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">✳</span>
                <h3>Your first quiz is just around the corner</h3>
                <p>Add a quiz JSON file to <code>src/quizzes</code> to see it here.</p>
              </div>
            ) : (
              <div className="quiz-grid">
                {quizzes.map((quiz, index) => (
                  <button
                    className="quiz-card"
                    key={quiz.slug}
                    type="button"
                    onClick={() => openQuiz(quiz.slug)}
                  >
                    <span className={`quiz-art quiz-art-${index % 3}`} aria-hidden="true">
                      <span>{['✳', '◈', '✦'][index % 3]}</span>
                      <span className="art-orbit" />
                    </span>
                    <span className="quiz-card-content">
                      <span className="quiz-category">{quiz.category}</span>
                      <span className="quiz-title">{quiz.title}</span>
                      <span className="quiz-description">{quiz.description}</span>
                      <span className="quiz-card-footer">
                        <span>{quiz.questions.length} questions</span>
                        <span className="arrow-circle" aria-hidden="true">↗</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            <p className="privacy-note"><span aria-hidden="true">◌</span> Your results stay here, in this session.</p>
          </section>
        )}

        {activeSlug && !activeQuiz && (
          <section className="not-found">
            <span className="eyebrow">QUIZ NOT FOUND</span>
            <h1>That quiz has wandered off.</h1>
            <button className="button button-primary" type="button" onClick={returnToQuizzes}>
              Back to quizzes
            </button>
          </section>
        )}

        {activeQuiz && finished && (
          <section className="results-page">
            <button className="back-link" type="button" onClick={returnToQuizzes}>← All quizzes</button>
            <div className="results-hero">
              <span className="results-sparkle" aria-hidden="true">✦</span>
              <span className="eyebrow">QUIZ COMPLETE</span>
              <h1>{scorePercent >= 70 ? 'Nicely done.' : 'Good effort.'}</h1>
              <p>You finished <strong>{activeQuiz.title}</strong>. Every question is a chance to learn something new.</p>
              <div className="score-card">
                <div className="score-number">{score}<span>/{activeQuiz.questions.length}</span></div>
                <div className="score-copy">
                  <strong>{scorePercent}% correct</strong>
                  <span>{scorePercent === 100 ? 'A perfect round!' : scorePercent >= 70 ? 'You really know your stuff.' : 'Keep that curiosity going.'}</span>
                </div>
                <div className="score-ring" style={{ '--score': `${scorePercent}%` } as React.CSSProperties}>
                  <span>{scorePercent}%</span>
                </div>
              </div>
            </div>
            <div className="review-section">
              <div className="section-heading">
                <div><h2>Your answers</h2><p>Review how you did, one question at a time.</p></div>
                <span className="count-pill">{String(activeQuiz.questions.length).padStart(2, '0')}</span>
              </div>
              <div className="review-list">
                {activeQuiz.questions.map((question, index) => {
                  const result = results[index]
                  return (
                    <article className="review-item" key={`${index}-${question.prompt}`}>
                      <div className={`review-status ${result.correct ? 'is-correct' : 'is-incorrect'}`}>
                        {result.correct ? '✓' : '×'}
                      </div>
                      <div className="review-body">
                        <span className="review-number">QUESTION {String(index + 1).padStart(2, '0')}</span>
                        <h3>{question.prompt}</h3>
                        <p className="review-answer">Your answer: <strong>{question.options[result.selected]}</strong></p>
                        {result.revealed ? (
                          <div className="revealed-answer">
                            <strong>Correct answer:</strong> {question.options[question.answer]}
                            {question.explanation && <span>{question.explanation}</span>}
                          </div>
                        ) : (
                          <button className="reveal-link" type="button" onClick={() => revealAnswer(index)}>
                            {result.correct ? 'Explain' : 'Reveal correct answer'} <span aria-hidden="true">→</span>
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
              <button className="button button-primary restart-button" type="button" onClick={() => openQuiz(activeQuiz.slug)}>
                <span aria-hidden="true">↻</span> Try again
              </button>
            </div>
          </section>
        )}

        {activeQuiz && !finished && currentQuestion && (
          <section className="quiz-page">
            <button className="back-link" type="button" onClick={returnToQuizzes}>← All quizzes</button>
            <div className="quiz-heading">
              <span className="eyebrow">{activeQuiz.category}</span>
              <h1>{activeQuiz.title}</h1>
              <p>{activeQuiz.description}</p>
            </div>
            <div className="question-card">
              <div className="question-meta">
                <span>QUESTION <strong>{String(questionIndex + 1).padStart(2, '0')}</strong></span>
                <span>{String(activeQuiz.questions.length).padStart(2, '0')} TOTAL</span>
              </div>
              <div className="progress-track" role="progressbar" aria-label="Quiz progress" aria-valuenow={questionIndex + 1} aria-valuemin={0} aria-valuemax={activeQuiz.questions.length}>
                <span style={{ width: `${((questionIndex + 1) / activeQuiz.questions.length) * 100}%` }} />
              </div>
              <h2 className="question-prompt">{currentQuestion.prompt}</h2>
              <div className="options-list" role="group" aria-label="Answer choices">
                {currentQuestion.options.map((option, index) => (
                  <button
                    className={`option-button${selectedOption === index ? ' is-selected' : ''}${currentResult && selectedOption === index ? currentResult.correct ? ' is-correct' : ' is-incorrect' : ''}`}
                    key={option}
                    type="button"
                    disabled={Boolean(currentResult)}
                    aria-pressed={selectedOption === index}
                    onClick={() => setSelectedOption(index)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>
              {currentResult && (
                <div className={`answer-feedback ${currentResult.correct ? 'feedback-correct' : 'feedback-incorrect'}`} role="status">
                  <span className="feedback-icon" aria-hidden="true">{currentResult.correct ? '✓' : '!'}</span>
                  <div>
                    <strong>{currentResult.correct ? 'That’s right!' : 'Not quite!'}</strong>
                    <p>{currentResult.correct ? 'Nice work. Ready for the next one?' : 'No worries. You can retry or reveal the answer.'}</p>
                  </div>
                  {currentResult.correct && !currentResult.revealed && (
                    <button className="feedback-reveal" type="button" onClick={() => revealAnswer(questionIndex)}>Explain</button>
                  )}
                  {!currentResult.correct && (
                    <>
                      <button className="feedback-reveal" type="button" onClick={retryAnswer}>Retry</button>
                      {!currentResult.revealed && (
                        <button className="feedback-reveal" type="button" onClick={() => revealAnswer(questionIndex)}>Reveal answer</button>
                      )}
                    </>
                  )}
                  {currentResult.revealed && (
                    <span className="feedback-answer">Answer: {currentQuestion.options[currentQuestion.answer]}</span>
                  )}
                </div>
              )}
              {currentResult?.revealed && currentQuestion.explanation && (
                <p className="explanation">{currentQuestion.explanation}</p>
              )}
              <div className="question-actions">
                <span className="selection-hint">{currentResult ? 'Your answer is saved for this session.' : 'Choose the answer that feels right.'}</span>
                {currentResult ? (
                  <button className="button button-primary" type="button" onClick={continueQuiz}>
                    {questionIndex === activeQuiz.questions.length - 1 ? 'See my results' : 'Next question'} <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <button className="button button-primary" type="button" disabled={selectedOption === null} onClick={submitAnswer}>
                    Check answer <span aria-hidden="true">→</span>
                  </button>
                )}
              </div>
            </div>
            <p className="session-note"><span aria-hidden="true">◌</span> Your progress is only saved for this session.</p>
          </section>
        )}
      </main>
      <footer className="footer"><span>mcquiz</span><span>Made for curious minds.</span></footer>
    </div>
  )
}

export default App
