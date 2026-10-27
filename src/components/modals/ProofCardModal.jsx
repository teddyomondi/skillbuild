import React from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import UpskillProofCard from '../UpskillProofCard.jsx';

export default function ProofCardModal({
  isOpen,
  onClose,
  proofData
}) {
  if (!isOpen || !proofData) return null;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md animate-in fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-[99999] w-[95vw] max-w-4xl max-h-[92vh] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-2xl border-none p-0 shadow-2xl focus:outline-none animate-in fade-in-0 zoom-in-95">
          <UpskillProofCard proofData={proofData} onClose={onClose} isModal={true} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
