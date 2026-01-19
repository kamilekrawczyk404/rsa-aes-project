import { useMutation } from "@tanstack/react-query";
import type { UploadResponse } from "../types/crypto.ts";
import { apiClient } from "../lib/axios.ts";

export const useFileUpload = () => {
  return useMutation({
    mutationFn: async (files: File[]): Promise<UploadResponse> => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await apiClient.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    },
  });
};
