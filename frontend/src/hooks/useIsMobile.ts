import { useEffect, useState } from "react";

const useIsMobile = () => {
  const [screenSize, setScreenSize] = useState<number | null>(
    window.innerWidth,
  );

  useEffect(() => {
    const handleWindowChange = () => {
      setScreenSize(window.innerWidth);
    };

    window.addEventListener("resize", handleWindowChange);

    return () => window.removeEventListener("resize", handleWindowChange);
  }, []);

  if (screenSize !== null) return screenSize <= 991;

  return false;
};

export default useIsMobile;
