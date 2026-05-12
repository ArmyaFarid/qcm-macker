"use client";

import { useState, useEffect } from "react";
import { QCMQuiz, QCM_PROGRESS_KEY } from "./QCMQuiz";
import type { QCMData } from "./QCMQuiz";

const STORAGE_KEY = "qcm-data";

type ManifestEntry = {
    id: string;
    file: string;
    title: string;
    questionCount: number;
    imageCount: number;
    sizeKb: number;
};

interface QCMLoaderProps {
    defaultData: QCMData;
}

export const QCMLoader: React.FC<QCMLoaderProps> = ({ defaultData }) => {
    const [data, setData] = useState<QCMData | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [manifest, setManifest] = useState<ManifestEntry[]>([]);
    const [loadingId, setLoadingId] = useState<string | null>(null);
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
        fetch("/qcms/manifest.json")
            .then(r => r.json())
            .then((entries: ManifestEntry[]) => setManifest(entries))
            .catch(() => {});
    }, []);

    async function loadVersion(entry: ManifestEntry) {
        setLoadingId(entry.id);
        setError(null);
        try {
            const res = await fetch(`/qcms/${entry.file}`);
            if (!res.ok) throw new Error("Erreur réseau");
            const parsed = (await res.json()) as QCMData;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            localStorage.removeItem(QCM_PROGRESS_KEY);
            setData(parsed);
        } catch {
            setError(`Impossible de charger « ${entry.title} ».`);
        } finally {
            setLoadingId(null);
        }
    }

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target?.result as string) as QCMData;
                if (!parsed.meta?.title || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
                    setError("Fichier invalide : il doit contenir `meta.title` et un tableau `questions` non vide.");
                    return;
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                localStorage.removeItem(QCM_PROGRESS_KEY);
                setData(parsed);
            } catch {
                setError("Impossible de lire le fichier. Vérifiez qu'il s'agit d'un JSON valide.");
            }
        };
        reader.readAsText(file);
        e.target.value = "";
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
                manifest={manifest}
                loadingId={loadingId}
                error={error}
                onSelect={loadVersion}
                onFile={handleFile}
            />
        );
    }

    return <QCMQuiz data={data} onChangeQuiz={handleChangeQuiz} />;
};

interface SelectorScreenProps {
    manifest: ManifestEntry[];
    loadingId: string | null;
    error: string | null;
    onSelect: (entry: ManifestEntry) => void;
    onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const VERSION_STYLES: Record<string, { border: string; bg: string; badge: string; badgeText: string; icon: React.ReactNode }> = {
    v1: {
        border: "border-indigo-200 hover:border-indigo-400",
        bg: "bg-indigo-50",
        badge: "bg-indigo-100 text-indigo-700",
        badgeText: "Générale",
        icon: (
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
        ),
    },
    v2: {
        border: "border-emerald-200 hover:border-emerald-400",
        bg: "bg-emerald-50",
        badge: "bg-emerald-100 text-emerald-700",
        badgeText: "Identification",
        icon: (
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
        ),
    },
    v3: {
        border: "border-orange-200 hover:border-orange-400",
        bg: "bg-orange-50",
        badge: "bg-orange-100 text-orange-700",
        badgeText: "Thérapeutique",
        icon: (
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
        ),
    },
    v4: {
        border: "border-violet-200 hover:border-violet-400",
        bg: "bg-violet-50",
        badge: "bg-violet-100 text-violet-700",
        badgeText: "⚠ Images IA",
        icon: (
            <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
        ),
    },
};

function SelectorScreen({ manifest, loadingId, error, onSelect, onFile }: SelectorScreenProps) {
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
                    <p className="text-sm text-gray-500">Choisissez une version ou chargez votre propre fichier JSON.</p>
                </div>

                {/* Version cards */}
                {manifest.length > 0 ? (
                    <div className="flex flex-col gap-3 mb-5">
                        {manifest.map(entry => {
                            const style = VERSION_STYLES[entry.id] ?? VERSION_STYLES["v1"];
                            const isLoading = loadingId === entry.id;
                            const imgPct = Math.round((entry.imageCount / entry.questionCount) * 100);
                            const isAI = entry.id === "v4";

                            return (
                                <button
                                    key={entry.id}
                                    onClick={() => !isLoading && onSelect(entry)}
                                    disabled={loadingId !== null}
                                    className={`w-full text-left p-4 rounded-2xl border-2 bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed ${style.border}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-xl ${style.bg} shrink-0`}>
                                            {style.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                                                    {style.badgeText}
                                                </span>
                                                {isAI ? (
                                                    <span className="text-xs text-violet-500 font-medium">Schémas générés par IA</span>
                                                ) : null}
                                            </div>
                                            <p className="text-sm font-semibold text-gray-800 truncate">
                                                {entry.title}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-xs text-gray-400">{entry.questionCount} questions</span>
                                                <span className="text-xs text-gray-400">·</span>
                                                <span className="text-xs text-gray-400">{imgPct}% avec image</span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 self-center">
                                            {isLoading ? (
                                                <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 mb-5">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-full h-20 bg-white rounded-2xl border-2 border-gray-100 animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">ou</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Upload */}
                <label className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 cursor-pointer hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    Charger mon propre fichier JSON
                    <input type="file" accept=".json,application/json" onChange={onFile} className="hidden" />
                </label>

                {error ? (
                    <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 leading-relaxed">
                        {error}
                    </p>
                ) : null}

                <p className="mt-5 text-xs text-gray-400 text-center">
                    Le quiz chargé est mémorisé dans votre navigateur.
                </p>
            </div>
        </div>
    );
}
