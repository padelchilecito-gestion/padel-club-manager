// frontend/src/components/ui/ConfirmModal.jsx
// --- PEGA ESTE CÓDIGO EN EL ARCHIVO NUEVO ---

import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Exportamos 'ConfirmModal' por nombre
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  confirmColor = 'red' 
}) => {
  if (!isOpen) return null;
  
  const colorClasses = {
    red: 'bg-error hover:bg-red-700 focus-visible:ring-red-500', // Usamos "error" de DaisyUI
    blue: 'bg-primary hover:bg-blue-700 focus-visible:ring-blue-500',
    green: 'bg-success hover:bg-green-700 focus-visible:ring-green-500',
  };

  const iconColorClasses = {
    red: 'text-error', // Usamos "error" de DaisyUI
    blue: 'text-primary',
    green: 'text-success',
  };

  const buttonClass = `inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${colorClasses[confirmColor] || colorClasses['red']}`;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-base-200 p-6 text-left align-middle shadow-xl transition-all border border-base-content/20">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="rounded-md bg-base-200 text-base-content/70 hover:text-base-content focus:outline-none focus:ring-2 focus:ring-base-content/50 focus:ring-offset-2 focus:ring-offset-base-200"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-base-300 sm:mx-0 sm:h-10 sm:w-10 ${iconColorClasses[confirmColor]}`}>
                    <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-base-content">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-base-content/70">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-3">
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={onConfirm}
                  >
                    {confirmText}
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-base-content/50 bg-base-100 px-4 py-2 text-sm font-medium text-base-content shadow-sm hover:bg-opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-base-content/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 mt-3 sm:mt-0"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
