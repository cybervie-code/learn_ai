import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  Clock, CheckCircle2, XCircle, ArrowRight, ArrowLeft, RotateCcw,
  Trophy, Zap, AlertCircle, Loader2,
} from 'lucide-react';

export default function QuizPlayer() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState('quiz'); // quiz -> results
  const [timeLeft, setTimeLeft] = useState(null);
  const [questionStart, setQuestionStart] = useState(Date.now());

  useEffect(() => {
    api.startAttempt(quizId).then((res) => {
      const a = res.data.data;
      setAttempt(a);
      // Resuming an attempt: jump straight to the first unanswered question
      const firstUnanswered = (a.questionSnapshots || []).findIndex((_, i) =>
        !(a.responses || []).some((r) => r.questionSnapshotIndex === i)
      );
      if (firstUnanswered > 0) setCurrentIndex(firstUnanswered);
      setLoading(false);
    }).catch((err) => {
      toast.error(err.response?.data?.message || 'Failed to start quiz');
      navigate(-1);
    });
  }, [quizId]);

  // Timer — auto-submit on expiry, but only while still on the quiz screen
  useEffect(() => {
    if (!attempt?.expiresAt || phase !== 'quiz') return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(attempt.expiresAt) - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        handleSubmit();
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt, phase]);

  const currentQuestion = attempt?.questionSnapshots?.[currentIndex];
  const totalQuestions = attempt?.questionSnapshots?.length || 0;

  const handleSelect = (key) => {
    if (feedback) return; // locked after submit
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmitAnswer = async () => {
    if (selectedKeys.length === 0) {
      toast.error('Please select an answer');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitAnswer(attempt._id, {
        questionSnapshotIndex: currentIndex,
        selectedKeys,
        timeSpent: Math.max(1, Math.round((Date.now() - questionStart) / 1000)),
      });
      setAttempt(res.data.data.attempt); // reveals this question's answers (learning mode)
      setFeedback(res.data.data.feedback);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedKeys([]);
      setFeedback(null);
      setQuestionStart(Date.now());
    } else {
      handleSubmit();
    }
  };

  // Skip without submitting — counted as skipped in scoring
  const handleSkip = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedKeys([]);
      setFeedback(null);
      setQuestionStart(Date.now());
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await api.submitAttempt(attempt._id);
      setAttempt(res.data.data);
      setPhase('results');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  }, [attempt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-600 dark:text-brand-400" size={32} />
      </div>
    );
  }

  // Results screen
  if (phase === 'results') {
    const { percentage, correctCount, incorrectCount, skippedCount, earnedPoints, totalPoints, xpAwarded } = attempt;
    const passed = percentage >= 60;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className={`card p-8 text-center ${passed ? 'border-green-600/30' : 'border-yellow-600/30'}`}>
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${passed ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
            {passed ? <Trophy size={36} className="text-green-600 dark:text-green-400" /> : <AlertCircle size={36} className="text-yellow-600 dark:text-yellow-400" />}
          </div>
          <h1 className="text-3xl font-bold text-content mb-2">{passed ? 'Quiz Passed!' : 'Keep Practicing!'}</h1>
          <p className="text-muted mb-6">{passed ? 'Great job mastering this topic.' : 'Review the material and try again.'}</p>

          <div className="text-5xl font-bold text-content mb-2">{percentage}%</div>
          <p className="text-sm text-subtle">{earnedPoints} / {totalPoints} points</p>

          {xpAwarded > 0 && (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 text-sm font-medium mt-4">
              <Zap size={14} /> +{xpAwarded} XP earned!
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-content">{correctCount}</div>
            <div className="text-xs text-subtle">Correct</div>
          </div>
          <div className="card p-4 text-center">
            <XCircle size={20} className="text-red-600 dark:text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-content">{incorrectCount}</div>
            <div className="text-xs text-subtle">Incorrect</div>
          </div>
          <div className="card p-4 text-center">
            <Clock size={20} className="text-muted mx-auto mb-1" />
            <div className="text-2xl font-bold text-content">{skippedCount}</div>
            <div className="text-xs text-subtle">Skipped</div>
          </div>
        </div>

        {/* Review answers */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-content mb-4">Review Answers</h2>
          <div className="space-y-4">
            {attempt.questionSnapshots.map((q, i) => {
              const response = attempt.responses.find((r) => r.questionSnapshotIndex === i);
              return (
                <div key={i} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-start gap-2 mb-2">
                    <span className={`shrink-0 ${response?.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {response?.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </span>
                    <p className="text-sm text-muted">{q.questionText}</p>
                  </div>
                  {q.options.map((opt) => (
                    <div
                      key={opt.key}
                      className={`text-xs ml-6 mt-1 px-2 py-1 rounded inline-block mr-2 ${
                        opt.isCorrect
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : response?.selectedKeys?.includes(opt.key)
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'text-subtle'
                      }`}
                    >
                      {opt.key}. {opt.text}
                      {opt.isCorrect && ' ✓'}
                    </div>
                  ))}
                  {q.options.find((o) => o.isCorrect)?.explanation && (
                    <p className="text-xs text-subtle ml-6 mt-2 italic">
                      {q.options.find((o) => o.isCorrect)?.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate('/app/learn')} className="btn-secondary flex-1">
            <ArrowLeft size={16} /> Back to Learn
          </button>
          <button onClick={() => window.location.reload()} className="btn-primary flex-1">
            <RotateCcw size={16} /> Retry Quiz
          </button>
        </div>
      </div>
    );
  }

  // Quiz question screen
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted">Question {currentIndex + 1} of {totalQuestions}</span>
          {timeLeft !== null && timeLeft > 0 && (
            <span className="flex items-center gap-1 text-sm text-muted">
              <Clock size={14} /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          )}
        </div>
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-300"
            style={{ width: `${((currentIndex + (feedback ? 1 : 0)) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="card p-6">
        {currentQuestion?.scenario && (
          <div className="p-4 rounded-lg bg-surface-2/50 border border-border-strong mb-4 text-sm text-muted">
            {currentQuestion.scenario}
          </div>
        )}
        <h2 className="text-lg font-semibold text-content mb-6">{currentQuestion?.questionText}</h2>

        <div className="space-y-3">
          {currentQuestion?.optionOrder?.map((key) => {
            const option = currentQuestion.options.find((o) => o.key === key);
            if (!option) return null;
            const isSelected = selectedKeys.includes(key);
            const showResult = feedback && (option.isCorrect || isSelected);

            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                disabled={!!feedback}
                className={`w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3 ${
                  feedback
                    ? option.isCorrect
                      ? 'border-green-600 bg-green-500/10'
                      : isSelected
                      ? 'border-red-600 bg-red-500/10'
                      : 'border-border opacity-50'
                    : isSelected
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-border-strong hover:border-border-strong hover:bg-surface-2/50'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                  feedback
                    ? option.isCorrect
                      ? 'bg-green-500 text-white'
                      : isSelected
                      ? 'bg-red-500 text-white'
                      : 'bg-surface-2 text-subtle'
                    : isSelected
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-2 text-muted'
                }`}>
                  {feedback && option.isCorrect ? '✓' : feedback && isSelected && !option.isCorrect ? '✗' : option.key}
                </span>
                <span className="text-sm text-content flex-1">{option.text}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback — assessment mode returns no isCorrect, so show a neutral state */}
        {feedback && (
          <div className={`mt-6 p-4 rounded-lg animate-fade-in ${
            feedback.isCorrect === undefined
              ? 'bg-surface-2/60 border border-border'
              : feedback.isCorrect
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {feedback.isCorrect === undefined
                ? <CheckCircle2 size={18} className="text-muted" />
                : feedback.isCorrect
                ? <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
                : <XCircle size={18} className="text-red-600 dark:text-red-400" />}
              <span className={`font-medium ${
                feedback.isCorrect === undefined
                  ? 'text-content'
                  : feedback.isCorrect
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {feedback.isCorrect === undefined ? 'Answer recorded' : feedback.isCorrect ? 'Correct!' : 'Not quite right'}
              </span>
              {feedback.pointsAwarded > 0 && (
                <span className="text-xs text-brand-600 dark:text-brand-400 ml-auto">+{feedback.pointsAwarded} points</span>
              )}
            </div>
            {feedback.explanation && (
              <p className="text-sm text-muted">{feedback.explanation}</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary" disabled={submitting}>
          <ArrowLeft size={16} /> Exit
        </button>
        {!feedback ? (
          <>
            <button onClick={handleSkip} className="btn-ghost text-sm" disabled={submitting}>
              Skip
            </button>
            <button onClick={handleSubmitAnswer} disabled={submitting || selectedKeys.length === 0} className="btn-primary flex-1">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Answer'}
            </button>
          </>
        ) : (
          <button onClick={handleNext} className="btn-primary flex-1">
            {currentIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Quiz'} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
