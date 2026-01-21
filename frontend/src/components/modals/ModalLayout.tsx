import { useModal } from "../../context/ModalContext.tsx";
import React, { type ReactNode } from "react";
import Button from "../button/Button.tsx";

interface HeaderProps {
  title: string;
  description?: string;
  hideCloseButton?: boolean;
}

const ModalLayout = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`flex flex-col w-full ${className}`}>{children}</div>;

const Header = ({ title, description, hideCloseButton }: HeaderProps) => {
  const { closeModal } = useModal();

  return (
    <div
      className={
        "flex items-start justify-between p-6 border-b border-slate-200 bg-white"
      }
    >
      <div>
        <h3 className={"text-lg font-semibold text-slate-900 leading-none"}>
          {title}
        </h3>
        {description && (
          <p className={"mt-2 text-sm text-slate-500"}>{description}</p>
        )}
      </div>

      {!hideCloseButton && <Button.Close onClick={closeModal} />}
    </div>
  );
};

const Body = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`p-6 overflow-y-auto flex-1 ${className}`}>{children}</div>
  );
};

interface FooterOptions {
  onProceed: () => void;
  showCancelButton?: boolean;
  showProceedButton?: boolean;
  renderCustomButtons?: () => ReactNode;
  onClose?: () => void;
}

const Footer = ({
  options,
  className = "",
}: {
  options?: FooterOptions;
  className?: string;
}) => {
  const { closeModal } = useModal();

  const defaultOptions = {
    showCancelButton: true,
    showProceedButton: true,
    renderCustomButtons: undefined,
    onClose: undefined,
    onProceed: () => {},
  };

  const finalOptions = { ...defaultOptions, ...options };

  return (
    <div
      className={`p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-4 ${className}`}
    >
      {finalOptions.renderCustomButtons !== undefined ? (
        finalOptions.renderCustomButtons()
      ) : (
        <>
          {finalOptions.showCancelButton && (
            <button
              type={"button"}
              className={"text-slate-500"}
              onClick={finalOptions.onClose ? finalOptions.onClose : closeModal}
            >
              Anuluj
            </button>
          )}

          {finalOptions.showProceedButton && (
            <Button.Process onClick={finalOptions.onProceed}>
              Wróć do konfiguracji
            </Button.Process>
          )}
        </>
      )}
    </div>
  );
};

ModalLayout.Header = Header;
ModalLayout.Body = Body;
ModalLayout.Footer = Footer;

export default ModalLayout;
