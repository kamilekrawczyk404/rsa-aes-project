import React, { useCallback, useEffect, useRef, useState } from "react";
import { FileImage, FileQuestionMark, FileText, FileUp, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { FileWithMeta } from "../../types/crypto.ts";
import { useSystemConfig } from "../../hooks/useSystemConfig.ts";
import Banner from "../Banner.tsx";
import Container from "../../layouts/Container.tsx";

const getFileIcon = (fileExtension: string) => {
  switch (fileExtension) {
    case ".jpg":
    case ".png":
      return <FileImage size={"2rem"} />;
    case ".pdf":
    case ".docx":
    case ".txt":
      return <FileText size={"2rem"} />;
    default:
      return <FileQuestionMark size={"2rem"} />;
  }
};

const getFileSize = (file: File): string => {
  const sizeInMB = (file.size / 1024 / 1024).toFixed(2);

  if (sizeInMB == "0.00") {
    return (file.size / 1024).toFixed(2) + " KB";
  }

  return sizeInMB + " MB";
};

type FilesUploadProps = {
  onFilesChange?: (files: FileWithMeta[]) => void;
  className?: string;
};

const FilesUpload = ({ onFilesChange, className }: FilesUploadProps) => {
  const { data: config, isLoading, isError } = useSystemConfig();

  const maxFileSize = config?.max_file_size_bytes || 0;
  const allowedExtensions = config?.allowed_extensions || [];

  const refFileInput = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileList, setFileList] = useState<FileWithMeta[]>([]);

  const prevFilesRef = useRef<FileWithMeta[]>([]);

  useEffect(() => {
    const prevFiles = prevFilesRef.current;

    const hasChanged =
      fileList.length !== prevFiles.length ||
      !fileList.every(
        (file, index) =>
          file.id === prevFiles[index].id &&
          file.progress === prevFiles[index].progress,
      );

    if (hasChanged) {
      prevFilesRef.current = fileList;

      // Run callback for parent component
      if (onFilesChange) {
        onFilesChange(fileList);
      }
    }
  }, [fileList, onFilesChange]);

  const simulateLoading = (fileId: string) => {
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 15;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFileList((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress, status: "completed" } : f,
          ),
        );
      } else {
        setFileList((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress: Math.round(progress) } : f,
          ),
        );
      }
    }, 200);
  };

  const processFiles = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const extension = "." + file.name.split(".").pop()?.toLowerCase();

      const isTypeValid = allowedExtensions.includes(extension);
      const isSizeValid = file.size <= maxFileSize;

      if (!isSizeValid)
        console.warn(
          `File ${file.name} exceeds the maximum file size - ${maxFileSize} bytes`,
        );
      if (!isTypeValid)
        console.warn(
          `File ${file.name} has unsupported file extension - ${extension}`,
        );

      return isTypeValid && isSizeValid;
    });

    if (validFiles.length === 0) return;

    const newFileMetas: FileWithMeta[] = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: "uploading",
    }));

    setFileList((prev) => [...prev, ...newFileMetas]);

    newFileMetas.forEach((fileMeta) => {
      simulateLoading(fileMeta.id);
    });
  }, []);

  const handleDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }

    if (refFileInput.current) refFileInput.current.value = "";
  };

  const removeFile = (idToRemove: string) => {
    setFileList((prev) => {
      const updated = prev.filter((f) => f.id !== idToRemove);
      if (onFilesChange) onFilesChange(updated);
      return updated;
    });
  };

  if (isLoading) return <div>Ładowanie konfiguracji...</div>;
  if (isError)
    return (
      <Banner.Error
        title={"Nastąpił błąd w czasie pobierania konfiguracji"}
        description={
          "Upewnij się, że masz dostęp do internetu. Jeżeli problem nie ustępuje skontaktuj się z administratorem aplikacji."
        }
      />
    );

  return (
    <Container className={`${className}`}>
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropFiles}
        className={`flex flex-col gap-4 items-center justify-center min-h-52 rounded-lg custom-border bg-slate-50 transition-colors lg:p-0 p-4 ${
          isDragging ? "bg-blue-700/10" : ""
        }`}
      >
        <input
          ref={refFileInput}
          type={"file"}
          className={"hidden"}
          onChange={handleFileInputChange}
          multiple
        />
        <FileUp className={"text-slate-500"} size={"2rem"} />
        <div className={"text-center space-y-1"}>
          <h3 className={"text-xl font-semibold"}>
            Przeciągnij i upuść lub{" "}
            <span
              onClick={() => refFileInput?.current?.click()}
              className={
                "text-blue-700 underline underline-offset-2 cursor-pointer"
              }
            >
              wybierz pliki
            </span>
            , które chcesz zaszyfrować
          </h3>
          <p className={"text-slate-500 text-sm"}>
            Maksymalny rozmiar pliku to 10MB
          </p>
        </div>
      </motion.div>

      <p className={"text-slate-500 text-sm mt-1"}>
        Akcepowalne pliki:{" "}
        {allowedExtensions.map((t, index) => (
          <span key={t}>
            {t}
            {index !== allowedExtensions.length - 1 && ", "}
          </span>
        ))}
      </p>

      <motion.div
        layout
        className={"grid lg:grid-cols-2 gap-3 mt-4 overflow-y-scroll max-h-72"}
      >
        <AnimatePresence mode={"popLayout"}>
          {fileList.map((fileMeta) => (
            <FileInstance
              key={fileMeta.id}
              fileMeta={fileMeta}
              remove={removeFile}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </Container>
  );
};

const FileInstance = ({
  fileMeta,
  remove,
}: {
  fileMeta: FileWithMeta;
  remove: (id: string) => void;
}) => {
  return (
    <motion.div
      layout
      key={fileMeta.id}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.9,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      className={
        "relative rounded-lg overflow-hidden border-[1px] border-blue-200 bg-blue-50 group lg:p-4 p-2 place-content-center"
      }
    >
      <motion.div
        initial={{ marginBottom: ".5rem" }}
        animate={{
          marginBottom: fileMeta.status === "completed" ? 0 : ".5rem",
        }}
        transition={{
          delay: 0.1,
        }}
        className={"flex justify-between items-center gap-2"}
      >
        <div className={"flex items-center gap-2"}>
          <span className={"text-blue-700"}>
            {getFileIcon(
              "." + fileMeta.file.name.split(".").pop()?.toLowerCase(),
            )}
          </span>
          <div>
            <p className={"text-sm font-semibold line-clamp-2"}>
              {fileMeta.file.name}
            </p>
            <div className={"text-slate-500 text-xs"}>
              <span>{getFileSize(fileMeta.file)}</span>
              {fileMeta.status === "uploading" && (
                <span>• Przetwarzanie...</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            remove(fileMeta.id);
          }}
        >
          <X className={"text-slate-500"} size={"1.5rem"} />
        </button>
      </motion.div>

      <motion.div
        layout
        initial={{ opacity: 1, height: "auto" }}
        animate={{
          opacity: fileMeta.status === "completed" ? 0 : 1,
          height: fileMeta.status === "completed" ? 0 : "auto",
        }}
        transition={{
          height: { delay: 0.1 },
          duration: 0.3,
        }}
        className={"w-full flex gap-2 items-center"}
      >
        <div className={"relative h-2 rounded-md bg-slate-50 w-full "}>
          <motion.div
            className={"absolute left-0 top-0 h-full bg-blue-700 rounded-md"}
            initial={{ width: 0 }}
            animate={{ width: `${fileMeta.progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
        <span className={"text-sm text-slate-500 w-9 text-left"}>
          {fileMeta.progress}%
        </span>
      </motion.div>
    </motion.div>
  );
};

export default FilesUpload;
