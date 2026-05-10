"use client";

import { useState, useEffect } from "react";
import { QCMQuiz, QCM_PROGRESS_KEY } from "./QCMQuiz";
import type { QCMData } from "./QCMQuiz";

const STORAGE_KEY = "qcm-data";

interface QCMLoaderProps {
    defaultData: QCMData;
}

export const QCMLoader: React.FC<QCMLoaderProps> = ({ defaultData }) => {
    const [data, setData] = useState<QCMData | null>(null);
    const [hydrated, setHydrated] = useState(false);
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
                setData(parsed);
            } catch {
                setError("Impossible de lire le fichier. Vérifiez qu'il s'agit d'un JSON valide.");
            }
        };
        reader.readAsText(file);

        e.target.value = "";
    }

    function loadDefault() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        setData(defaultData);
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
            <LandingScreen
                onFile={handleFile}
                onDefault={loadDefault}
                error={error}
            />
        );
    }

    return <QCMQuiz data={data} onChangeQuiz={handleChangeQuiz} />;
};

interface LandingScreenProps {
    onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDefault: () => void;
    error: string | null;
}

function LandingScreen({ onFile, onDefault, error }: LandingScreenProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5">
                    <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                    </svg>
                </div>

                <h1 className="text-xl font-bold text-gray-900 mb-1">QCM App</h1>
                <p className="text-sm text-gray-500 mb-7">
                    Chargez votre fichier JSON ou utilisez le quiz de démonstration.
                </p>

                <div className="flex flex-col gap-3">
                    <label className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold cursor-pointer hover:bg-indigo-700 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                        Charger un fichier JSON
                        <input
                            type="file"
                            accept=".json,application/json"
                            onChange={onFile}
                            className="hidden"
                        />
                    </label>

                    <button
                        onClick={onDefault}
                        className="px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
                    >
                        Utiliser le quiz de démonstration
                    </button>
                </div>

                {error ? (
                    <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5 leading-relaxed">
                        {error}
                    </p>
                ) : null}

                <p className="mt-5 text-xs text-gray-400 text-center leading-relaxed">
                    Le fichier chargé est mémorisé dans votre navigateur jusqu'au prochain changement.
                </p>
            </div>
        </div>
    );
}
