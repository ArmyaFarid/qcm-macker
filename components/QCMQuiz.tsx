"use client";

import { useState, useEffect } from "react";

export type Answer = {
    id: string;
    text: string;
    correct: boolean;
    feedback: string;
};

export type Question = {
    id: number;
    question: string;
    image: string | null;
    multiple: boolean;
    difficulty?: number;
    answers: Answer[];
};

export type QCMData = {
    meta: { title: string; theme?: string };
    questions: Question[];
};

export const QCM_PROGRESS_KEY = "qcm-progress";

const DEV_PASSWORD = "2961";

type QCMProgress = {
    currentIndex: number;
    selections: Record<number, string[]>;
    validated: number[];
    showScore: boolean;
};

function loadProgress(): QCMProgress | null {
    try {
        const saved = localStorage.getItem(QCM_PROGRESS_KEY);
        if (saved) return JSON.parse(saved) as QCMProgress;
    } catch {}
    return null;
}

interface QCMQuizProps {
    data: QCMData;
    onChangeQuiz?: () => void;
}

type AnswerStatus = "default" | "correct" | "incorrect" | "missed";

function getAnswerStatus(answer: Answer, isSelected: boolean): AnswerStatus {
    if (answer.correct && isSelected) return "correct";
    if (!answer.correct && isSelected) return "incorrect";
    if (answer.correct && !isSelected) return "missed";
    return "default";
}

function isQuestionCorrect(question: Question, selections: Record<number, string[]>): boolean {
    const sel = selections[question.id] ?? [];
    const correctIds = question.answers.filter(a => a.correct).map(a => a.id);
    if (sel.length !== correctIds.length) return false;
    return correctIds.every(id => sel.includes(id));
}

export const QCMQuiz: React.FC<QCMQuizProps> = ({ data, onChangeQuiz }) => {
    const { questions, meta } = data;
    const [currentIndex, setCurrentIndex] = useState<number>(() => loadProgress()?.currentIndex ?? 0);
    const [selections, setSelections] = useState<Record<number, string[]>>(() => loadProgress()?.selections ?? {});
    const [validated, setValidated] = useState<Set<number>>(() => new Set(loadProgress()?.validated ?? []));
    const [showScore, setShowScore] = useState<boolean>(() => loadProgress()?.showScore ?? false);

    const [devMode, setDevMode] = useState(false);
    const [showDevPrompt, setShowDevPrompt] = useState(false);
    const [devPasswordInput, setDevPasswordInput] = useState("");
    const [devPasswordError, setDevPasswordError] = useState(false);
    const [jumpValue, setJumpValue] = useState("");

    useEffect(() => {
        localStorage.setItem(QCM_PROGRESS_KEY, JSON.stringify({
            currentIndex,
            selections,
            validated: [...validated],
            showScore,
        } satisfies QCMProgress));
    }, [currentIndex, selections, validated, showScore]);

    const currentQuestion = questions[currentIndex];
    const isValidated = validated.has(currentQuestion.id);
    const currentSelections = selections[currentQuestion.id] ?? [];
    const isLastQuestion = currentIndex === questions.length - 1;
    const progress = ((currentIndex + 1) / questions.length) * 100;

    function handleSelect(answerId: string) {
        if (isValidated) return;
        setSelections(prev => {
            const current = prev[currentQuestion.id] ?? [];
            let next: string[];
            if (currentQuestion.multiple) {
                next = current.includes(answerId)
                    ? current.filter(id => id !== answerId)
                    : [...current, answerId];
            } else {
                next = [answerId];
            }
            return { ...prev, [currentQuestion.id]: next };
        });
    }

    function handleValidate() {
        setValidated(prev => new Set([...prev, currentQuestion.id]));
    }

    function handleDevUnlock() {
        if (devPasswordInput === DEV_PASSWORD) {
            setDevMode(true);
            setShowDevPrompt(false);
            setDevPasswordInput("");
            setDevPasswordError(false);
        } else {
            setDevPasswordError(true);
        }
    }

    function closeDevPrompt() {
        setShowDevPrompt(false);
        setDevPasswordInput("");
        setDevPasswordError(false);
    }

    function handleJump() {
        const n = parseInt(jumpValue, 10);
        if (!isNaN(n) && n >= 1 && n <= questions.length) {
            setCurrentIndex(n - 1);
            setJumpValue("");
        }
    }

    const score = questions.filter(q => isQuestionCorrect(q, selections)).length;

    if (showScore) {
        return (
            <ScorePage
                questions={questions}
                selections={selections}
                score={score}
                onRestart={() => {
                    localStorage.removeItem(QCM_PROGRESS_KEY);
                    setCurrentIndex(0);
                    setSelections({});
                    setValidated(new Set());
                    setShowScore(false);
                }}
                onChangeQuiz={onChangeQuiz}
            />
        );
    }

    const feedbackItems = isValidated
        ? currentQuestion.answers
              .map(a => ({ answer: a, status: getAnswerStatus(a, currentSelections.includes(a.id)) }))
              .filter(({ status }) => status !== "default")
        : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
            {/* Dev password modal */}
            {showDevPrompt ? (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                    onClick={closeDevPrompt}
                >
                    <div
                        className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-base font-semibold text-gray-800 mb-1">Mode développeur</h2>
                        <p className="text-xs text-gray-400 mb-4">Entrez le mot de passe pour activer.</p>
                        <input
                            type="password"
                            value={devPasswordInput}
                            onChange={e => { setDevPasswordInput(e.target.value); setDevPasswordError(false); }}
                            onKeyDown={e => e.key === "Enter" && handleDevUnlock()}
                            placeholder="Mot de passe"
                            autoFocus
                            className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none mb-3 ${
                                devPasswordError
                                    ? "border-red-400 bg-red-50"
                                    : "border-gray-200 focus:border-indigo-400"
                            }`}
                        />
                        {devPasswordError ? (
                            <p className="text-xs text-red-600 mb-3">Mot de passe incorrect.</p>
                        ) : null}
                        <div className="flex gap-2">
                            <button
                                onClick={closeDevPrompt}
                                className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDevUnlock}
                                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all"
                            >
                                Activer
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="max-w-2xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-xl font-bold text-indigo-900">{meta.title}</h1>
                        <div className="flex items-center gap-2">
                            {devMode ? (
                                <span className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                    DEV
                                </span>
                            ) : null}
                            {onChangeQuiz ? (
                                <button
                                    onClick={onChangeQuiz}
                                    className="text-xs text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                    </svg>
                                    Changer de quiz
                                </button>
                            ) : null}
                            <button
                                onClick={() => devMode ? setDevMode(false) : setShowDevPrompt(true)}
                                title={devMode ? "Désactiver le mode dev" : "Mode développeur"}
                                className={`p-1 rounded-lg transition-colors ${
                                    devMode
                                        ? "text-amber-500 hover:text-amber-600"
                                        : "text-gray-300 hover:text-gray-400"
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0 tabular-nums">
                            {currentIndex + 1} / {questions.length}
                        </span>
                    </div>
                </div>

                {/* Question card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <p className="text-base font-semibold text-gray-800 mb-4 leading-snug">
                        {currentQuestion.question}
                    </p>

                    {currentQuestion.image ? (
                        <div className="w-full mb-4 rounded-xl overflow-hidden bg-gray-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={currentQuestion.image.startsWith("data:") ? currentQuestion.image : `/images/${currentQuestion.image}`}
                                alt=""
                                className="w-full max-h-64 object-contain"
                            />
                        </div>
                    ) : null}

                    {currentQuestion.multiple ? (
                        <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-3">
                            Plusieurs réponses possibles
                        </p>
                    ) : null}

                    <div className="flex flex-col gap-2">
                        {currentQuestion.answers.map(answer => {
                            const isSelected = currentSelections.includes(answer.id);
                            const status = isValidated ? getAnswerStatus(answer, isSelected) : "default";

                            const borderColor = {
                                default: isSelected ? "border-indigo-500" : "border-gray-200",
                                correct: "border-green-500",
                                incorrect: "border-red-400",
                                missed: "border-orange-400",
                            }[status];

                            const bgColor = {
                                default: isSelected ? "bg-indigo-50" : "bg-white hover:bg-gray-50",
                                correct: "bg-green-50",
                                incorrect: "bg-red-50",
                                missed: "bg-orange-50",
                            }[status];

                            const icon = {
                                default: null,
                                correct: <span className="ml-auto shrink-0 text-green-600 font-bold">✓</span>,
                                incorrect: <span className="ml-auto shrink-0 text-red-500 font-bold">✗</span>,
                                missed: <span className="ml-auto shrink-0 text-orange-400 font-bold">!</span>,
                            }[status];

                            return (
                                <label
                                    key={answer.id}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${borderColor} ${bgColor} ${isValidated ? "cursor-default" : "cursor-pointer"}`}
                                >
                                    <input
                                        type={currentQuestion.multiple ? "checkbox" : "radio"}
                                        name={`q-${currentQuestion.id}`}
                                        checked={isSelected}
                                        onChange={() => handleSelect(answer.id)}
                                        disabled={isValidated}
                                        className="w-4 h-4 accent-indigo-600 shrink-0"
                                    />
                                    <span className="text-sm text-gray-700 leading-relaxed">
                                        <span className="font-semibold">{answer.id}.</span> {answer.text}
                                    </span>
                                    {icon}
                                </label>
                            );
                        })}
                    </div>

                    {feedbackItems.length > 0 ? (
                        <div className="mt-4 flex flex-col gap-2">
                            {feedbackItems.map(({ answer, status }) => (
                                <div
                                    key={answer.id}
                                    className={`text-sm px-4 py-2.5 rounded-lg leading-relaxed ${
                                        status === "correct"
                                            ? "bg-green-100 text-green-800"
                                            : status === "incorrect"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-orange-100 text-orange-800"
                                    }`}
                                >
                                    <span className="font-semibold">
                                        {status === "correct"
                                            ? "✓ Correct"
                                            : status === "incorrect"
                                            ? "✗ Incorrect"
                                            : "! Manquée"}{" "}
                                        ({answer.id}) —
                                    </span>{" "}
                                    {answer.feedback}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setCurrentIndex(i => i - 1)}
                        disabled={currentIndex === 0}
                        className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        ← Précédent
                    </button>

                    <div className="flex items-center gap-2">
                        {/* Dev jump widget */}
                        {devMode ? (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-amber-600 font-mono">Q</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={questions.length}
                                    value={jumpValue}
                                    onChange={e => setJumpValue(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleJump()}
                                    placeholder="—"
                                    className="w-12 text-xs border-2 border-amber-300 rounded-lg px-1.5 py-1.5 text-center bg-amber-50 focus:outline-none focus:border-amber-500 tabular-nums"
                                />
                                <button
                                    onClick={handleJump}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold hover:bg-amber-200 transition-all"
                                >
                                    →
                                </button>
                            </div>
                        ) : null}

                        {/* Valider — always visible when not yet validated */}
                        {!isValidated ? (
                            <button
                                onClick={handleValidate}
                                disabled={currentSelections.length === 0}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                Valider
                            </button>
                        ) : null}

                        {/* Suivant / Voir le score — unlocked normally after validation, always in dev mode */}
                        {(isValidated || devMode) ? (
                            isLastQuestion ? (
                                <button
                                    onClick={() => setShowScore(true)}
                                    className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-all"
                                >
                                    Voir le score →
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentIndex(i => i + 1)}
                                    className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all ${
                                        devMode && !isValidated
                                            ? "bg-amber-500 hover:bg-amber-600"
                                            : "bg-indigo-600 hover:bg-indigo-700"
                                    }`}
                                >
                                    {devMode && !isValidated ? "Passer →" : "Suivant →"}
                                </button>
                            )
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ScorePageProps {
    questions: Question[];
    selections: Record<number, string[]>;
    score: number;
    onRestart: () => void;
    onChangeQuiz?: () => void;
}

function ScorePage({ questions, selections, score, onRestart, onChangeQuiz }: ScorePageProps) {
    const total = questions.length;
    const percentage = Math.round((score / total) * 100);

    const scoreColor =
        percentage >= 70 ? "text-green-600" : percentage >= 40 ? "text-orange-500" : "text-red-600";
    const barColor =
        percentage >= 70 ? "bg-green-500" : percentage >= 40 ? "bg-orange-400" : "bg-red-500";
    const message =
        percentage >= 70
            ? "Excellent travail !"
            : percentage >= 40
            ? "Pas mal, continuez !"
            : "Révisez et réessayez !";

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
            <div className="max-w-2xl mx-auto flex flex-col gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">
                        Score final
                    </p>
                    <div className={`text-6xl font-bold mb-1 ${scoreColor}`}>
                        {score} / {total}
                    </div>
                    <p className="text-gray-500 mb-1">{percentage}% de bonnes réponses</p>
                    <p className={`font-semibold mb-6 ${scoreColor}`}>{message}</p>

                    <div className="w-full bg-gray-100 rounded-full h-3 mb-8">
                        <div
                            className={`h-3 rounded-full transition-all ${barColor}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    <h2 className="text-base font-semibold text-gray-700 mb-3 text-left">
                        Résumé par question
                    </h2>
                    <div className="flex flex-col gap-2 text-left">
                        {questions.map((q, i) => {
                            const correct = isQuestionCorrect(q, selections);
                            const userSel = selections[q.id] ?? [];
                            const correctIds = q.answers.filter(a => a.correct).map(a => a.id);

                            return (
                                <div
                                    key={q.id}
                                    className={`p-4 rounded-xl border-2 ${
                                        correct
                                            ? "border-green-200 bg-green-50"
                                            : "border-red-200 bg-red-50"
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span
                                            className={`text-base shrink-0 font-bold ${
                                                correct ? "text-green-600" : "text-red-500"
                                            }`}
                                        >
                                            {correct ? "✓" : "✗"}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                Q{i + 1}. {q.question}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Bonne(s) réponse(s) :{" "}
                                                <span className="font-semibold text-gray-600">
                                                    {correctIds.join(", ")}
                                                </span>
                                                {userSel.length > 0 ? (
                                                    <>
                                                        {" — "}Votre réponse :{" "}
                                                        <span className="font-semibold text-gray-600">
                                                            {userSel.join(", ")}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400"> — Sans réponse</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={onRestart}
                        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all"
                    >
                        Recommencer
                    </button>
                    {onChangeQuiz ? (
                        <button
                            onClick={onChangeQuiz}
                            className="w-full py-3 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:border-gray-300 hover:bg-white transition-all text-sm"
                        >
                            Charger un autre quiz
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
