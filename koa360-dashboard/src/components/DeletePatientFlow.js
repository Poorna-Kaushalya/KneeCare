import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faInfoCircle,
  faTrashAlt,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import api from "../api/api";

const DeletePatientFlow = ({ show, patient, onClose, onDeletionSuccess }) => {
  const [step, setStep] = useState(show ? "confirm" : "idle"); 
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("info");

  useEffect(() => {
    if (show && patient) {
      setStep("confirm");
      setNotificationMessage("");
      setNotificationType("info");
    } else if (!show) {
      setStep("idle");
    }
  }, [show, patient]);

  useEffect(() => {
    if (notificationMessage && step === "notification") {
      const timer = setTimeout(() => {
        setStep("idle");
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notificationMessage, step, onClose]);

  if (step === "idle" || !patient) {
    return null;
  }

  const handleConfirm = async () => {
    setStep("deleting");
    try {
      await api.delete(`/api/patients/${patient.id}`);
      setNotificationMessage(`Patient "${patient.name}" deleted successfully.`);
      setNotificationType("success");
      setStep("notification");
      onDeletionSuccess(patient.id);
    } catch (err) {
      console.error("Error deleting patient:", err);
      setNotificationMessage(
        `Failed to delete patient "${patient.name}": ${
          err.response?.data?.error || err.message
        }`
      );
      setNotificationType("error");
      setStep("notification");
    }
  };

  const handleCancel = () => {
    setStep("idle");
    onClose();
  };

  const notificationClasses = {
    success: "bg-emerald-600 border-emerald-700",
    error: "bg-rose-600 border-rose-700",
    info: "bg-blue-600 border-blue-700",
  };

  const iconClasses = {
    success: faCheckCircle,
    error: faTimesCircle,
    info: faInfoCircle,
  };

  return (
    <>
      {/* ✅ Confirmation Modal */}
      {step === "confirm" && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            onMouseDown={handleCancel}
          />

          {/* Card */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-rose-50 to-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faTrashAlt}
                        className="text-rose-600 text-lg"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-extrabold text-slate-800">
                        Confirm Deletion
                      </h2>
                      <p className="text-sm text-slate-600">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCancel}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                    title="Close"
                    type="button"
                  >
                    ✕
                  </button>
                </div>

                {/* Patient Badge */}
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                    {patient.name}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                    ID: {patient.id}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <FontAwesomeIcon
                    icon={faShieldAlt}
                    className="text-amber-600 mt-0.5"
                  />
                  <p className="text-sm text-amber-900">
                    Are you sure you want to delete this patient record? Once
                    deleted, it cannot be recovered.
                  </p>
                </div>

                {/* Buttons */}
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    type="button"
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-extrabold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleConfirm}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold transition shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                Tip: You can cancel safely if you clicked delete by mistake.
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "deleting" && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <div className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Deleting patient...
                  </h3>
                  <p className="text-sm text-slate-600">
                    Please wait a moment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "notification" && notificationMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 w-[92vw] max-w-md rounded-2xl border px-4 py-3 text-white shadow-2xl
            ${notificationClasses[notificationType] || notificationClasses.info}
          `}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <FontAwesomeIcon
                icon={iconClasses[notificationType] || faInfoCircle}
                className="text-lg"
              />
            </div>

            <div className="flex-1">
              <p className="font-extrabold text-sm">Notification</p>
              <p className="text-sm opacity-95 mt-0.5">{notificationMessage}</p>
            </div>

            <button
              onClick={() => {
                setStep("idle");
                onClose();
              }}
              className="p-2 rounded-xl hover:bg-white/15 transition"
              aria-label="Close notification"
              type="button"
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
