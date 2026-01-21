import { useEffect } from "react";
import { useModal } from "../context/ModalContext";
import CryptoSummaryModal from "../components/modals/CryptoSummaryModal";
import type { BatchSummary, FileRaceState } from "../types/crypto";

const MOCK_SUMMARY: BatchSummary = {
  total_time: 12.45,
  total_files: 3,
  average_throughput: 1250000.5,
  average_cpu_usage: 99.3,
};

const MOCK_QUEUE: FileRaceState[] = [
  {
    fileId: "f1",
    fileName: "dokumentacja_techniczna_2024.pdf",
    fileSize: 2500000,
    status: "completed",
    aes: {
      progress: 100,
      cpu: 12.5,
      throughput: 450.2,
      finished: true,
      time: 0.15,
    },
    rsa: {
      progress: 100,
      cpu: 85.2,
      throughput: 2.1,
      finished: true,
      time: 4.25,
    },
  },
  {
    fileId: "f2",
    fileName: "wakacje_w_sopocie_4k.mp4",
    fileSize: 154000000,
    status: "completed",
    aes: {
      progress: 100,
      cpu: 15.0,
      throughput: 1100.0,
      finished: true,
      time: 1.2,
    },
    rsa: {
      progress: 100,
      cpu: 0,
      throughput: 0,
      finished: false,
      time: 0,
    },
  },
  {
    fileId: "f3",
    fileName: "tajne_hasla.txt",
    fileSize: 1024,
    status: "skipped",
    aes: {
      progress: 100,
      cpu: 5.0,
      throughput: 200.0,
      finished: true,
      time: 0.01,
    },
    rsa: {
      progress: 45,
      cpu: 90.0,
      throughput: 1.5,
      finished: false,
      time: 0,
    },
  },
];

export const DevModalTrigger = () => {
  const { openModal } = useModal();

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("🛠️ DEV: Otwieranie modala z fake danymi...");

      openModal(
        <CryptoSummaryModal
          mockSummary={MOCK_SUMMARY}
          mockQueue={MOCK_QUEUE}
        />,
        { closeOnBackdropClick: true },
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [openModal]);

  return null;
};
