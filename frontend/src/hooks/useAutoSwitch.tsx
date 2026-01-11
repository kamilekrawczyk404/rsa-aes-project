import { useCallback, useRef } from "react";
import { usePopups } from "../context/PopUpContext.tsx";
import type { PopupProps } from "../components/banners/Popup.tsx";
import AutoSwitchBody from "../components/banners/AutoSwitchBody.tsx";

export interface AutoSwitchOptions {
  popup: Omit<PopupProps, "id" | "position">;
  onNext: () => void;
  onCancel: () => void;
  seconds?: number;
}

export const useAutoSwitch = () => {
  const { addNewPopup, closePopup } = usePopups();

  const autoSwitchId = useRef("");

  const triggerAutoSwitch = useCallback(
    (options: AutoSwitchOptions) => {
      const { popup, onNext, onCancel, seconds = 5 } = options;

      autoSwitchId.current = addNewPopup({
        ...popup,
        body: (
          <AutoSwitchBody
            popup={popup}
            onNext={onNext}
            onCancel={onCancel}
            seconds={seconds}
          />
        ),
      });
    },
    [addNewPopup],
  );

  const closeAutoSwitch = useCallback(() => {
    if (autoSwitchId.current !== "") closePopup(autoSwitchId.current);
  }, [closePopup]);

  return { triggerAutoSwitch, closeAutoSwitch };
};
