import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "./button"
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog"

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  isLoading = false
}) => {
  if (!isOpen) return null

  return (
    <DialogContent>
      <DialogHeader>
        <div className="flex items-center space-x-3">
          {variant === "destructive" && (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          )}
          <DialogTitle>{title}</DialogTitle>
        </div>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="px-6 py-4 flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          className={variant === "destructive" ? "bg-red-600 hover:bg-red-700" : "gradient-primary"}
        >
          {isLoading ? "Processing..." : confirmText}
        </Button>
      </div>
    </DialogContent>
  )
}

export { ConfirmDialog }