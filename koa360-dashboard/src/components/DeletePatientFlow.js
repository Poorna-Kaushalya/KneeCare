// src/components/DeletePatientFlow.js (NOT RECOMMENDED for good practices, but demonstrates combining)

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import api from "../api/api"; // Assuming you have api imported or passed

const DeletePatientFlow = ({ show, patient, onClose, onDeletionSuccess }) => {
  const [step, setStep] = useState(show ? 'confirm' : 'idle'); // 'confirm', 'deleting', 'notification', 'idle'
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');

  // Reset state when 'show' prop changes or patient changes
  useEffect(() => {
    if (show && patient) {
      setStep('confirm');
      setNotificationMessage('');
      setNotificationType('info');
    } else if (!show) {
      setStep('idle');
    }
  }, [show, patient]);

  // Handle notification visibility and auto-close
  useEffect(() => {
    if (notificationMessage && step === 'notification') {
      const timer = setTimeout(() => {
        setStep('idle'); // Move to idle after notification fades
        onClose(); // Close the entire flow
      }, 3000); // Notification duration

      return () => clearTimeout(timer);
    }
  }, [notificationMessage, step, onClose]);

  if (step === 'idle' || !patient) {
    return null;
  }

  const handleConfirm = async () => {
    setStep('deleting'); // Indicate that deletion is in progress
    try {
      await api.delete(`/api/patients/${patient.id}`);
      setNotificationMessage(`Patient "${patient.name}" deleted successfully.`);
      setNotificationType('success');
      setStep('notification');
      onDeletionSuccess(patient.id); // Notify parent of success
    } catch (err) {
      console.error("Error deleting patient:", err);
      setNotificationMessage(`Failed to delete patient "${patient.name}": ${err.response?.data?.error || err.message}`);
      setNotificationType('error');
      setStep('notification');
    }
  };

  const handleCancel = () => {
    setStep('idle');
    onClose(); // Close the entire flow without action
  };

  const notificationClasses = {
    success: "bg-green-500 border-green-700",
    error: "bg-red-500 border-red-700",
    info: "bg-blue-500 border-blue-700",
  };

  const iconClasses = {
    success: faCheckCircle,
    error: faTimesCircle,
    info: faInfoCircle,
  };

  return (
    <>
      {/* Confirmation Modal - only shown at 'confirm' step */}
      {step === 'confirm' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Deletion</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete patient "<strong>{patient.name}</strong>" (ID: <strong>{patient.id}</strong>)?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast - shown at 'notification' step */}
      {step === 'notification' && notificationMessage && (
        <div
          className={`fixed bottom-4 right-4 p-4 pr-6 rounded-lg shadow-lg text-white transform transition-all duration-300 ease-in-out z-50
            ${notificationClasses[notificationType] || notificationClasses.info}
            ${notificationMessage ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          `}
          role="alert"
        >
          <div className="flex items-center">
            <FontAwesomeIcon icon={iconClasses[notificationType] || faInfoCircle} className="mr-3 text-lg" />
            <p className="font-medium text-base">{notificationMessage}</p>
            <button
              onClick={() => {
                setStep('idle');
                onClose(); // Close the entire flow immediately if user clicks X
              }}
              className="ml-4 -mr-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              aria-label="Close notification"
            >
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DeletePatientFlow;