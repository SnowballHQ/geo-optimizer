import React, { useState } from 'react';
import { Button } from './ui/button';
import { Trash2, AlertTriangle, X } from 'lucide-react';

const DeletePromptModal = ({ 
  promptText, 
  categoryName, 
  onConfirm, 
  isDeleting = false,
  isSuperUser = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const truncatedPrompt = promptText && promptText.length > 100 
    ? promptText.slice(0, 100) + '...' 
    : promptText;

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        disabled={isDeleting}
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={!isDeleting ? handleCancel : undefined}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            {/* Close button */}
            {!isDeleting && (
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-semibold">Delete Prompt & Recalculate SOV?</h2>
            </div>

            {/* Content */}
            <div className="space-y-4 mb-6">
              <div className="text-sm text-gray-600">
                <strong>Prompt:</strong> "{truncatedPrompt}"
              </div>
              <div className="text-sm text-gray-600">
                <strong>Category:</strong> {categoryName}
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  This will:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Remove the prompt permanently</li>
                  <li>• Delete its AI response and brand mentions</li>
                  <li>• Automatically recalculate Share of Voice percentages{isSuperUser ? ' for this analysis' : ''}</li>
                </ul>
              </div>
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete & Recalculate'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeletePromptModal;