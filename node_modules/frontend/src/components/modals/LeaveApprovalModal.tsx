import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, User, Calendar, Clock } from 'lucide-react';

interface LeaveRequest {
  id: string;
  staff_id: string;
  staff_name: string;
  position: string;
  department: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'emergency' | 'maternity' | 'paternity' | 'study' | 'bereavement';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  emergency_contact: string | null;
  created_at: string;
}

interface LeaveApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (requestId: string, notes: string) => void;
  onReject: (requestId: string, notes: string) => void;
  request: LeaveRequest | null;
  action: 'approve' | 'reject';
  isLoading?: boolean;
}

const LeaveApprovalModal: React.FC<LeaveApprovalModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  request,
  action,
  isLoading = false
}) => {
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!request) return;

    if (action === 'reject' && !notes.trim()) {
      setErrors({ notes: 'Please provide a reason for rejection' });
      return;
    }

    if (action === 'approve') {
      onApprove(request.id, notes);
    } else {
      onReject(request.id, notes);
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      personal: 'Personal Leave',
      emergency: 'Emergency Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
      study: 'Study Leave',
      bereavement: 'Bereavement Leave'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {action === 'approve' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {action === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Request Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600"><strong>Staff:</strong> {request.staff_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600"><strong>Position:</strong> {request.position} - {request.department}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600"><strong>Leave Type:</strong> {getLeaveTypeLabel(request.leave_type)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600"><strong>Dates:</strong> {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600"><strong>Days:</strong> {request.days_requested} day{request.days_requested !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600"><strong>Status:</strong> 
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Reason for Leave</h4>
            <p className="text-sm text-gray-700">{request.reason}</p>
          </div>

          {request.emergency_contact && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
              <p className="text-sm text-gray-700">{request.emergency_contact}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  if (errors.notes) {
                    setErrors(prev => ({ ...prev, notes: '' }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.notes ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={action === 'approve' 
                  ? 'Add any notes about this approval...' 
                  : 'Please provide a reason for rejecting this leave request...'
                }
                rows={3}
                required={action === 'reject'}
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.notes}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2 ${
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>
                  {isLoading 
                    ? (action === 'approve' ? 'Approving...' : 'Rejecting...') 
                    : (action === 'approve' ? 'Approve Request' : 'Reject Request')
                  }
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaveApprovalModal;







