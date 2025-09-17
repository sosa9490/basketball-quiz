'use client';
/**
 * PAGE: Defensive Concepts (MVP with 6 clips)
 * - Full-screen bg + overlay
 * - Corner logos (scaled for mobile)
 * - Video + 4 choices, locks after answer
 * - Instant feedback + disabled “Why?” until answered
 * - Explanation bottom sheet (auto-opens on wrong)
 * - Prev/Next, progress bar, reset, summary
 * - LocalStorage progress
 */

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, RotateCcw, Play, Trophy } from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────────────
   QUIZ DATA — your clips, questions, choices, answer keys, and explanations
   NOTE: files must live in /public/clips/ and be referenced as /clips/...
──────────────────────────────────────────────────────────────────────────── */
const quizData = [
  {
    id: 'q1',
    title: 'Strong-side corner help',
    clipUrl: '/clips/strong_side_corner.mp4',
    question: 'What defensive mistake just happened here?',
    options: [
      'Helping from the strong-side corner',
      'Rotating from the weak side',
      'Executing a stunt',
      'Sinking to help the big',
    ],
    correctIndex: 0,
    explanation:
      'Helping from the strong-side corner is generally not advisable because it gives up one of the most efficient shots, the corner 3.',
  },
  {
    id: 'q2',
    title: 'Sink and fill',
    clipUrl: '/clips/sink_and_fill_v2.mp4',
    question: 'What type of interior rotation are Jamal Murray and Jeremy Grant executing?',
    options: ['Trap', 'Sink and fill', 'Switch', 'Zone shift'],
    correctIndex: 1,
    explanation:
      'A sink, where a perimeter player (Murray) sinks to help the helper (Jokić) and take away the interior pass. The nearest defender (Grant) then fills—positioning to rotate to whoever gets the ball.',
  },
  {
    id: 'q3',
    title: 'Guarding the popper: full rotation',
    clipUrl: '/clips/popper_full_rotation.mp4',
    question: 'How is the defense guarding the popper in this clip?',
    options: ['Switching the screen', 'Full rotation', 'Stunt and recover', 'No rotation (late contest from original defender)'],
    correctIndex: 1,
    explanation:
      'A full rotation means an off-ball defender fully commits to contest the popper’s shot, while the rest of the defense rotates to cover the open players.',
  },
  {
    id: 'q4',
    title: 'Guarding the popper: stunt & recover',
    clipUrl: '/clips/popper_stunt_recover.mp4',
    question: 'How is the defense guarding the popper in this clip?',
    options: ['Full rotation', 'Switch', 'Stunt and recover', 'Zone collapse'],
    correctIndex: 2,
    explanation:
      'In a stunt and recover, the nearest defender fakes help (stunt) to delay the popper’s shot or pass, then recovers to their own man, buying time for the screener’s defender to close out.',
  },
  {
    id: 'q5',
    title: 'Lock & trail vs shooter',
    clipUrl: '/clips/lock_and_trail.mp4',
    question: 'What defensive technique is this defender using to defend Michael Porter Jr. on this off-ball screen?',
    options: ['Shoot the gap', 'Switch', 'Lock and trail', 'Top lock'],
    correctIndex: 2,
    explanation:
      'Lock and trail means staying tight on the cutter’s hip, following them around the screen to give no space for a shot—used primarily vs shooting threats.',
  },
  {
    id: 'q6',
    title: 'Shoot the gap vs non-shooter',
    clipUrl: '/clips/shoot_the_gap.mp4',
    question: 'What defensive technique is this defender using to defend CJ McCollum on this off-ball screen?',
    options: ['Shoot the gap', 'Switch', 'Lock and trail', 'Top lock'],
    correctIndex: 0,
    explanation:
      'Shoot the gap means cutting under the screen to beat the cutter to the spot. It’s used more vs non-shooters to take away drives/cuts, but can be risky vs elite shooters.',
  },
] as const;

/* ────────────────────────────────────────────────────────────────────────────
   UTILS
──────────────────────────────────────────────────────────────────────────── */
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const pct = (x: number) => `${Math.round(x * 100)}%`;

/* ────────────────────────────────────────────────────────────────────────────
   PAGE
──────────────────────────────────────────────────────────────────────────── */
export default function Page() {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { selected: number; correct: boolean }>
  >({});
  const [showWhy, setShowWhy] = useState(false);
  const [persist, setPersist] = useState(true);

  // Restore progress on load
  useEffect(() => {
    try {
      const raw = localStorage.getItem('knicks-quiz-state');
      if (raw) {
        const { started: s, idx: i, answers: a } = JSON.parse(raw);
        setStarted(!!s);
        setIdx(typeof i === 'number' ? i : 0);
        setAnswers(a ?? {});
      }
    } catch {}
  }, []);

  // Persist progress when things change
  useEffect(() => {
    const payload = JSON.stringify({ started, idx, answers });
    localStorage.setItem('knicks-quiz-state', payload);
  }, [started, idx, answers]);

  const total = quizData.length;
  const current = quizData[idx];
  const completed = Object.keys(answers).length;
  const correctCount = useMemo(
    () => Object.values(answers).filter((a) => a.correct).length,
    [answers],
  );
  const progress = completed / total;
  const done = completed === total;

  function selectOption(q: (typeof quizData)[number], optionIndex: number) {
    if (answers[q.id]) return; // lock after first choice
    const isCorrect = optionIndex === q.correctIndex;
    setAnswers((prev) => ({
      ...prev,
      [q.id]: { selected: optionIndex, correct: isCorrect },
    }));
    if (!isCorrect) setShowWhy(true); // auto-open explanation on wrong
  }

  const goPrev = () => setIdx((i) => clamp(i - 1, 0, total - 1));
  const goNext = () => setIdx((i) => clamp(i + 1, 0, total - 1));
  function resetAll() {
    setAnswers({});
    setIdx(0);
    setStarted(false);
    localStorage.removeItem('knicks-quiz-state');
  }

  return (
    <div className="relative min-h-screen">
      {/* Background + overlay */}
      <Image
        src="/images/msg_action.jpg"
        alt="Background"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/70" aria-hidden />

      {/* Corner logos (smaller on mobile, so they don't collide with header) */}
      <header className="absolute left-3 top-3 z-20 sm:left-4 sm:top-4">
        <Image
          src="/images/knicks_logo.svg"
          alt="New York Knicks logo"
          width={84}
          height={84}
          className="drop-shadow-md sm:hidden"
          priority
        />
        <Image
          src="/images/knicks_logo.svg"
          alt=""
          width={64}
          height={64}
          className="hidden drop-shadow-md sm:block"
          priority
        />
      </header>
      <header className="absolute right-3 top-3 z-20 sm:right-4 sm:top-4">
        <Image
          src="/images/knicks_logo.svg"
          alt="New York Knicks logo"
          width={84}
          height={84}
          className="drop-shadow-md sm:hidden"
          priority
        />
        <Image
          src="/images/knicks_logo.svg"
          alt=""
          width={64}
          height={64}
          className="hidden drop-shadow-md sm:block"
          priority
        />
      </header>

      {/* Content with top padding to avoid overlapping logos */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-8 pt-28 sm:pt-24">
        {/* Header: title + progress + reset (centered, uncluttered) */}
        <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-white/60">
              Knowledge Check
            </p>
            <h1 className="text-lg font-semibold text-white">
              Defensive Concepts
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="w-48">
              <ProgressBar value={progress} />
            </div>
            <div className="text-sm tabular-nums text-white/70">
              {completed}/{total}
            </div>
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white/90 hover:bg-white/10"
              title="Reset session"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Start or active question */}
        {!started ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-md"
          >
            <p className="text-white/80">
              {total} scenarios — watch the clip, pick the correct rule, and
              see the “why.” Progress can be saved on this device.
            </p>

            <div className="mt-5 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={persist}
                  onChange={(e) => setPersist(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30 bg-white/10"
                />
                Remember progress on this device
              </label>
              <button
                onClick={() => setStarted(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-95"
              >
                <Play className="h-4 w-4" />
                Start
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <QuestionCard
              q={current}
              index={idx}
              total={total}
              answer={answers[current.id]}
              onSelect={(q, i) => selectOption(q, i)}
              onPrev={goPrev}
              onNext={goNext}
              onExplain={() => setShowWhy(true)}
            />

            <AnimatePresence>
              {done && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="mt-6"
                >
                  <SummaryCard
                    correct={correctCount}
                    total={total}
                    onRestart={resetAll}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Explainer sheet (bottom) — nudged up so the dev “N” badge won’t overlap */}
      <ExplainerSheet
        open={showWhy}
        onClose={() => setShowWhy(false)}
        q={current}
        answer={answers[current.id]}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   COMPONENTS
──────────────────────────────────────────────────────────────────────────── */

function ProgressBar({ value = 0 }: { value?: number }) {
  const v = clamp(value, 0, 1);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-orange-500"
        style={{ width: pct(v) }}
      />
    </div>
  );
}

function QuestionCard({
  q,
  index,
  total,
  answer,
  onSelect,
  onPrev,
  onNext,
  onExplain,
}: {
  q: typeof quizData[number];
  index: number;
  total: number;
  answer?: { selected: number; correct: boolean };
  onSelect: (q: typeof quizData[number], optionIndex: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onExplain: () => void;
}) {
  const isAnswered = !!answer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid items-start gap-6 lg:grid-cols-2"
    >
      {/* Video */}
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-black/60">
        <div className="grid aspect-video place-items-center">
          <video
            src={q.clipUrl}
            controls
            preload="metadata"
            className="h-full w-full"
          />
        </div>
        {/* (No under-clip text per your request) */}
      </div>

      {/* Question + options */}
      <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-md">
        <p className="text-xs uppercase tracking-widest text-white/60">
          Question
        </p>
        <h3 className="mt-1 text-xl font-semibold text-white">{q.question}</h3>

        <ul className="mt-4 space-y-3">
          {q.options.map((opt, i) => {
            const chosen = answer?.selected === i;
            const state = isAnswered
              ? i === q.correctIndex
                ? 'correct'
                : chosen
                ? 'wrong'
                : 'idle'
              : 'idle';

            return (
              <li key={i}>
                <button
                  disabled={isAnswered} // lock after first pick
                  onClick={() => onSelect(q, i)}
                  className={[
                    'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition',
                    state === 'correct' &&
                      'border-emerald-400/60 bg-emerald-400/10',
                    state === 'wrong' && 'border-red-400/60 bg-red-400/10',
                    state === 'idle' &&
                      'border-white/15 bg-black/30 hover:border-white/25',
                    isAnswered && 'cursor-default',
                  ].join(' ')}
                >
                  <span className="flex-1 text-white/90">{opt}</span>
                  {state === 'correct' && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  )}
                  {state === 'wrong' && (
                    <XCircle className="h-5 w-5 text-red-300" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Controls: Why? (disabled until answered) + Prev/Next */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={onExplain}
            disabled={!isAnswered}
            className={[
              'inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2',
              isAnswered
                ? 'text-white/90 hover:bg-white/10'
                : 'cursor-not-allowed text-white/30 opacity-40',
            ].join(' ')}
            title={isAnswered ? 'Explain the rule' : 'Answer first to unlock'}
          >
            <Info className="h-4 w-4" />
            Why?
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={index === 0}
              className="rounded-xl border border-white/20 px-3 py-2 text-white/90 hover:bg-white/10 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={onNext}
              disabled={index === total - 1}
              className="rounded-xl bg-white px-3 py-2 font-medium text-black hover:opacity-95 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ExplainerSheet({
  open,
  onClose,
  q,
  answer,
}: {
  open: boolean;
  onClose: () => void;
  q: typeof quizData[number];
  answer?: { selected: number; correct: boolean };
}) {
  const isCorrect = !!answer?.correct;
  const selected = answer?.selected;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />

          {/* Bottom sheet (nudged up to avoid dev “N” badge) */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="absolute inset-x-0 bottom-0 mx-auto mb-16 max-w-3xl rounded-t-3xl border border-white/15 bg-black/80 p-5 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-300" />
                )}
                <h4 className="text-lg font-semibold text-white">
                  {isCorrect ? 'Correct' : "Let's review"}
                </h4>
              </div>
              <button
                onClick={onClose}
                className="text-sm text-white/80 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-3 text-white/90">
              {typeof selected === 'number' && (
                <p className="text-sm">
                  You chose{' '}
                  <span className="font-medium">
                    {q.options[selected]}
                  </span>
                  . The correct answer is{' '}
                  <span className="font-medium">
                    {q.options[q.correctIndex]}
                  </span>
                  .
                </p>
              )}
              <p className="mt-3 leading-relaxed">{q.explanation}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SummaryCard({
  correct,
  total,
  onRestart,
}: {
  correct: number;
  total: number;
  onRestart: () => void;
}) {
  const ratio = clamp(correct / total, 0, 1);

  return (
    <div className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur">
      <div className="flex items-center gap-3 text-white/90">
        <Trophy className="h-5 w-5" />
        <p className="text-sm">Session Complete</p>
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-[160px_1fr]">
        {/* Clean SVG progress ring with color by score */}
        <div className="grid place-items-center rounded-2xl border border-white/15 bg-black/40 p-6">
          <div className="relative grid aspect-square w-32 place-items-center">
            <svg
              className="absolute inset-0 h-full w-full -rotate-90"
              viewBox="0 0 36 36"
              role="img"
              aria-label={`Score ${Math.round(ratio * 100)}%`}
            >
              {/* background track */}
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="4"
              />
              {/* progress */}
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke={
                  ratio >= 0.8 ? '#22c55e' : ratio >= 0.5 ? '#eab308' : '#ef4444'
                } // green / yellow / red
                strokeWidth="4"
                strokeDasharray="100"
                strokeDashoffset={100 - ratio * 100}
                strokeLinecap="round"
              />
            </svg>

            {/* center label */}
            <div className="relative grid aspect-square w-20 place-items-center rounded-full bg-black/70 text-white font-semibold">
              {Math.round(ratio * 100)}%
            </div>
          </div>
        </div>

        {/* Copy + Restart */}
        <div>
          <h3 className="text-xl font-semibold text-white">Nice work</h3>
          <p className="mt-1 text-white/80">
            You answered{' '}
            <span className="font-semibold text-white">{correct}</span> of{' '}
            {total} correctly.
          </p>
          <div className="mt-5">
            <button
              onClick={onRestart}
              className="rounded-xl bg-white px-4 py-2 font-medium text-black hover:opacity-95"
            >
              Restart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
