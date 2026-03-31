import { X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent showCloseButton={false} className="p-0 gap-0 w-80 h-auto rounded-lg overflow-hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex items-center justify-between px-5 py-4 bg-black">
          <span className="text-white font-semibold text-base">{title}</span>
          <button onClick={onCancel} className="text-white hover:text-gray-300">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700">{message}</p>
          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="text-xs bg-gray-200 text-gray-800 px-3 py-1.5 rounded hover:bg-gray-300">
              Cancel
            </button>
            <button onClick={onConfirm} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700">
              {confirmLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}