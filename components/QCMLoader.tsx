"use client";

import { useState, useEffect } from "react";
import { QCMQuiz, QCM_PROGRESS_KEY } from "./QCMQuiz";
import type { QCMData, Question } from "./QCMQuiz";

const STORAGE_KEY = "qcm-data";
const SELECTION_KEY = "qcm-selection";

type ThemeEntry = {
    id: string;
    file: string;
    title: string;
    color: string;
    icon: string;
};

type Selection = {
    themeIds: string[];
    maxDifficulty: number;
};

interface QCMLoaderProps {
    defaultData: QCMData;
}

export const QCMLoader: React.FC<QCMLoaderProps> = ({ defaultData }) => {
    const [data, setData] = useState<QCMData | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [themes, setThemes] = useState<ThemeEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setData(JSON.parse(stored) as QCMData);
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        fetch("/qcms/themes.json")
            .then(r => r.json())
            .then((entries: ThemeEntry[]) => setThemes(entries))
            .catch(() => {});
    }, []);

    async function loadSelection(selection: Selection) {
        if (selection.themeIds.length === 0) {
            setError("Sélectionnez au moins un thème.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const selectedThemes = themes.filter(t => selection.themeIds.includes(t.id));
            const themeData = await Promise.all(
                selectedThemes.map(async t => {
                    const res = await fetch(`/qcms/${t.file}`);
                    if (!res.ok) throw new Error(`Erreur chargement ${t.title}`);
                    return { theme: t, data: (await res.json()) as QCMData };
                })
            );

            const allQuestions: Question[] = [];
            for (const { theme, data: themeQcm } of themeData) {
                const filtered = themeQcm.questions.filter(
                    q => (q.difficulty ?? 1) <= selection.maxDifficulty
                );
                filtered.forEach((q, i) => {
                    allQuestions.push({
                        ...q,
                        id: allQuestions.length + 1,
                        question: `[${theme.title}] ${q.question}`,
                    });
                });
            }

            if (allQuestions.length === 0) {
                setError("Aucune question disponible pour cette sélection.");
                setLoading(false);
                return;
            }

            // Shuffle
            for (let i = allQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
            }
            allQuestions.forEach((q, i) => { q.id = i + 1; });

            const title = selectedThemes.length === 1
                ? selectedThemes[0].title
                : `${selectedThemes.length} thèmes sélectionnés`;

            const merged: QCMData = {
                meta: { title: `${title} · niveau max ${selection.maxDifficulty}` },
                questions: allQuestions,
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            localStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
            localStorage.removeItem(QCM_PROGRESS_KEY);
            setData(merged);
        } catch (e) {
            setError("Impossible de charger les questions.");
        } finally {
            setLoading(false);
        }
    }

    function handleChangeQuiz() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(QCM_PROGRESS_KEY);
        setData(null);
        setError(null);
    }

    if (!hydrated) return null;

    if (!data) {
        return (
            <SelectorScreen
                themes={themes}
                loading={loading}
                error={error}
                onStart={loadSelection}
            />
        );
    }

    return <QCMQuiz data={data} onChangeQuiz={handleChangeQuiz} />;
};

interface SelectorScreenProps {
    themes: ThemeEntry[];
    loading: boolean;
    error: string | null;
    onStart: (selection: Selection) => void;
}

const COLOR_STYLES: Record<string, { border: string; bg: string; checked: string; text: string }> = {
    indigo:  { border: "border-indigo-200",  bg: "bg-indigo-50",  checked: "border-indigo-500 bg-indigo-100",   text: "text-indigo-700" },
    red:     { border: "border-red-200",     bg: "bg-red-50",     checked: "border-red-500 bg-red-100",         text: "text-red-700" },
    amber:   { border: "border-amber-200",   bg: "bg-amber-50",   checked: "border-amber-500 bg-amber-100",     text: "text-amber-700" },
    rose:    { border: "border-rose-200",    bg: "bg-rose-50",    checked: "border-rose-500 bg-rose-100",       text: "text-rose-700" },
    emerald: { border: "border-emerald-200", bg: "bg-emerald-50", checked: "border-emerald-500 bg-emerald-100", text: "text-emerald-700" },
    violet:  { border: "border-violet-200",  bg: "bg-violet-50",  checked: "border-violet-500 bg-violet-100",   text: "text-violet-700" },
};

const DIFFICULTY_LABELS = [
    { level: 1, label: "Facile", description: "Questions de base, recall factuel", color: "text-emerald-600" },
    { level: 2, label: "Intermédiaire", description: "Clinique et physiopathologie", color: "text-amber-600" },
    { level: 3, label: "Difficile", description: "Cas complexes, intégration", color: "text-red-600" },
];

function SelectorScreen({ themes, loading, error, onStart }: SelectorScreenProps) {
    const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
    const [maxDifficulty, setMaxDifficulty] = useState<number>(2);

    function toggleTheme(id: string) {
        setSelectedThemes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    function toggleAll() {
        if (selectedThemes.size === themes.length) {
            setSelectedThemes(new Set());
        } else {
            setSelectedThemes(new Set(themes.map(t => t.id)));
        }
    }

    function handleStart() {
        onStart({
            themeIds: [...selectedThemes],
            maxDifficulty,
        });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">QCM Stomatologie S9</h1>
                    <p className="text-sm text-gray-500">Choisissez vos thèmes et le niveau de difficulté.</p>
                </div>

                {/* Themes */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Thèmes</h2>
                        {themes.length > 0 ? (
                            <button
                                onClick={toggleAll}
                                className="text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                            >
                                {selectedThemes.size === themes.length ? "Tout désélectionner" : "Tout sélectionner"}
                            </button>
                        ) : null}
                    </div>

                    {themes.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {themes.map(theme => {
                                const isSelected = selectedThemes.has(theme.id);
                                const style = COLOR_STYLES[theme.color] ?? COLOR_STYLES["indigo"];
                                return (
                                    <button
                                        key={theme.id}
                                        onClick={() => toggleTheme(theme.id)}
                                        className={`w-full text-left p-3 rounded-xl border-2 bg-white transition-all flex items-center gap-3 ${
                                            isSelected ? style.checked : `${style.border} hover:bg-gray-50`
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                            isSelected ? `${style.text.replace("text-", "border-")} ${style.text.replace("text-", "bg-")}` : "border-gray-300"
                                        }`}>
                                            {isSelected ? (
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                </svg>
                                            ) : null}
                                        </div>
                                        <span className="text-sm font-medium text-gray-800 flex-1">{theme.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="w-full h-12 bg-white rounded-xl border-2 border-gray-100 animate-pulse" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Difficulty */}
                <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                        Niveau de complexité max
                    </h2>
                    <div className="flex flex-col gap-2">
                        {DIFFICULTY_LABELS.map(d => {
                            const isSelected = maxDifficulty === d.level;
                            return (
                                <button
                                    key={d.level}
                                    onClick={() => setMaxDifficulty(d.level)}
                                    className={`w-full text-left p-3 rounded-xl border-2 bg-white transition-all flex items-center gap-3 ${
                                        isSelected ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                        isSelected ? "border-indigo-500" : "border-gray-300"
                                    }`}>
                                        {isSelected ? <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" /> : null}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-800">Niveau {d.level} — {d.label}</span>
                                            <span className={`text-xs font-medium ${d.color}`}>
                                                {"●".repeat(d.level)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Inclut toutes les questions de niveau ≤ {maxDifficulty}.
                    </p>
                </div>

                {/* Start button */}
                <button
                    onClick={handleStart}
                    disabled={selectedThemes.size === 0 || loading}
                    className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Chargement...
                        </>
                    ) : (
                        <>
                            Commencer le quiz
                            {selectedThemes.size > 0 ? (
                                <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded-full">
                                    {selectedThemes.size} thème{selectedThemes.size > 1 ? "s" : ""}
                                </span>
                            ) : null}
                        </>
                    )}
                </button>

                {error ? (
                    <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 leading-relaxed">
                        {error}
                    </p>
                ) : null}

                <p className="mt-5 text-xs text-gray-400 text-center">
                    Les questions sont mélangées et mémorisées dans votre navigateur.
                </p>
            </div>
        </div>
    );
}
