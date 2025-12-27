export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bitów";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bitów", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const formatSpeed = (mbps: number) => {
  if (mbps < 1) return `${(mbps * 1024).toFixed(0)} KB/s`;
  return `${mbps.toFixed(1)} MB/s`;
};
