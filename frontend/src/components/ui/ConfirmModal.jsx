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
    red: 'bg-danger hover:bg-red-700 focus-visible:ring-red-500',
    blue: 'bg-primary hover:bg-blue-700 focus-visible:ring-blue-500',
    green: 'bg-green-600 hover:bg-green-700 focus-visible:ring-green-500',
  };

  const iconColorClasses = {
    red: 'text-danger',
    blue: 'text-primary',
    green: 'text-green-600',
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-dark-secondary p-6 text-left align-middle shadow-xl transition-all border border-text-secondary/20">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="rounded-md bg-dark-secondary text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-text-secondary/50 focus:ring-offset-2 focus:ring-offset-dark-secondary"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-dark-primary sm:mx-0 sm:h-10 sm:w-10 ${iconColorClasses[confirmColor]}`}>
                    <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-text-primary">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-text-secondary">
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
                    className="inline-flex w-full justify-center rounded-md border border-text-secondary/50 bg-dark-primary px-4 py-2 text-sm font-medium text-text-primary shadow-sm hover:bg-opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-secondary mt-3 sm:mt-0"
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
