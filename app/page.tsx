import { QCMLoader } from "@/components/QCMLoader";
import type { QCMData } from "@/components/QCMQuiz";
import rawData from "@/data/qcm.json";

export default function Home() {
    return <QCMLoader defaultData={rawData as QCMData} />;
}
