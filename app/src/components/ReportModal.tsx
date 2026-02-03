import { useState } from 'react';
import { X, Flag } from 'lucide-react';
import { createReport } from '@/lib/api';
import { useTelegram } from '@/hooks/useTelegram';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'exam' | 'user';
  reportedId: string;
  onSuccess?: () => void;
}

const reportReasons = [
  { id: 'wrong_content', label: 'Wrong Content' },
  { id: 'spam', label: 'Spam' },
  { id: 'copyright', label: 'Copyright Issue' },
  { id: 'other', label: 'Other' },
] as const;

export function ReportModal({ isOpen, onClose, reportType, reportedId, onSuccess }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hapticFeedback, showAlert } = useTelegram();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      showAlert('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReport({
        report_type: reportType,
        reported_id: reportedId,
        reason: selectedReason as 'wrong_content' | 'spam' | 'copyright' | 'other',
      });
      hapticFeedback('success');
      showAlert('Report submitted successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Report error:', error);
      showAlert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <Flag size={20} className="modal-icon" />
            <span className="modal-title">Report {reportType === 'exam' ? 'Exam' : 'User'}</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <p className="report-description">
            Please select a reason for reporting this {reportType}:
          </p>
          
          <div className="report-reasons">
            {reportReasons.map((reason) => (
              <label 
                key={reason.id} 
                className={`report-reason ${selectedReason === reason.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={(e) => setSelectedReason(e.target.value)}
                />
                <span>{reason.label}</span>
              </label>
            ))}
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
