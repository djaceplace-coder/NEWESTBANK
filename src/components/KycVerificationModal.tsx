/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KycVerificationModal: React.FC<KycVerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, createTicket } = useStore();

  const [fullName, setFullName] = useState(
    user ? `${user.firstName} ${user.lastName}` : '',
  );
  const [dob, setDob] = useState('');
  const [ssnLast4, setSsnLast4] = useState('');
  const [address, setAddress] = useState('');
  const [docType, setDocType] = useState<'passport' | 'drivers_license' | 'national_id'>('drivers_license');
  const [documentBase64, setDocumentBase64] = useState<string | null>(null);
  const [documentLabel, setDocumentLabel] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // On-demand camera state — ONLY activated when user explicitly clicks "Capture with Camera"
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  if (!isOpen || !user) return null;

  const handleStartCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera capture is not supported in this browser. Please upload a photo or PDF of your ID below.',
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError(
        'Camera permission was declined or unavailable. You can upload an ID image or PDF file instead.',
      );
      stopCamera();
    }
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const maxWidth = 960;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);

    stopCamera();
    setDocumentBase64(dataUrl);
    setDocumentLabel('Camera ID Capture (JPEG)');
    toast.success('ID photo captured.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 650 * 1024) {
      toast.error('Please select a file smaller than 650 KB.');
      return;
    }
    stopCamera();
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result) {
        setDocumentBase64(result);
        setDocumentLabel(file.name);
        setCameraError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !dob || !address.trim()) {
      toast.error('Please complete your legal name, date of birth, and address.');
      return;
    }
    if (!documentBase64) {
      toast.error('Please upload an ID document or capture a photo before submitting.');
      return;
    }

    setSubmitting(true);
    const maskedSsn = ssnLast4.replace(/\D/g, '').slice(-4) || 'N/A';
    const docTypeLabel =
      docType === 'passport'
        ? 'Passport'
        : docType === 'drivers_license'
          ? "Driver's License"
          : 'National ID Card';

    const summary = [
      `Legal Name: ${fullName.trim()}`,
      `Date of Birth: ${dob}`,
      `SSN / Tax ID (Last 4): ***-**-${maskedSsn}`,
      `Residential Address: ${address.trim()}`,
      `Document Type: ${docTypeLabel}`,
      `Capture Source: ${documentLabel || 'Uploaded File'}`,
    ].join('\n');

    try {
      await createTicket(
        'KYC Identity Verification Packet',
        summary,
        'KYC',
        documentBase64,
      );
      stopCamera();
      setDocumentBase64(null);
      setDocumentLabel('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                In-Site Identity Verification (KYC)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reviewed directly by Morning Bright compliance administrators
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close KYC modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jordan Taylor"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Last 4 Digits of SSN / Tax ID
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                required
                value={ssnLast4}
                onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Government ID Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              >
                <option value="drivers_license">Driver&apos;s License</option>
                <option value="passport">Passport</option>
                <option value="national_id">National ID Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Residential Address
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="1200 Market St, Suite 400, San Francisco, CA 94103"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Document Capture Section — On-demand camera OR file upload */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Identity Document
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload file or use camera on demand
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-emerald-600 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-emerald-600" />
                Upload ID File
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={cameraActive ? stopCamera : handleStartCamera}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-emerald-600 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                {cameraActive ? 'Cancel Camera' : 'Capture with Camera'}
              </button>
            </div>

            {cameraError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            {cameraActive && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 space-y-3 p-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-52 object-cover rounded-lg bg-black"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-300">
                    Center your government ID clearly inside the frame
                  </span>
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Take Photo
                  </button>
                </div>
              </div>
            )}

            {documentBase64 && !cameraActive && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                <div className="flex items-center gap-3 min-w-0">
                  {documentBase64.startsWith('data:image') ? (
                    <img
                      src={documentBase64}
                      alt="Captured identity document preview"
                      className="w-12 h-9 object-cover rounded-md border border-emerald-300 dark:border-emerald-700 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-9 rounded-md bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 truncate">
                      {documentLabel || 'Document attached'}
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready for compliance submission
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDocumentBase64(null);
                    setDocumentLabel('');
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" /> Replace
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting Packet...' : 'Submit Verification Packet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
