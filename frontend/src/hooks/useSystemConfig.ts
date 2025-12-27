import type { SystemConfig } from "../types/crypto.ts";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/axios.ts";

const DEFAULT_CONFIG: SystemConfig = {
  max_file_size_bytes: 10 * 1024 * 1024, // 10MB
  allowed_extensions: [".jpg", ".png", ".txt", ".pdf", ".docx"],
};

export const useSystemConfig = () => {
  return useQuery<SystemConfig>({
    queryKey: ["system-config"],
    queryFn: async () => {
      const { data } = await apiClient.get<SystemConfig>("/config");
      return data;
      // return DEFAULT_CONFIG;
    },
    placeholderData: DEFAULT_CONFIG,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
};
