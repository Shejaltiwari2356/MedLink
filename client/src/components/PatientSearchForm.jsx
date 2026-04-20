import React, { useState } from 'react';
import { Search, Send } from 'lucide-react';

const PatientSearchForm = ({ onSearch, onGenerateOtp, isLoading, error, message }) => {
    const [patientId, setPatientId] = useState('');
    const [otp, setOtp] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch({ patientId, otp });
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-2xl font-bold mb-4">Access Patient History</h3>
            <p className="text-gray-600 mb-6">Enter the patient's ID to request an OTP, then enter the OTP to view their records.</p>
            
            {error && <p className="mb-4 text-center bg-red-100 text-red-700 p-3 rounded-md">{error}</p>}
            {message && <p className="mb-4 text-center bg-green-100 text-green-700 p-3 rounded-md">{message}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="flex-grow">
                        <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">Patient's Unique ID</label>
                        <input type="text" id="patientId" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="e.g., PAT-10001" className="mt-1 w-full input-style" required />
                    </div>
                    <button type="button" onClick={() => onGenerateOtp(patientId)} disabled={isLoading} className="self-end px-4 py-2 mt-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50">
                        {isLoading ? 'Sending...' : <Send className="h-5 w-5"/>}
                    </button>
                </div>
                <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700">One-Time Password (OTP)</label>
                    <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP from patient" className="mt-1 w-full input-style" required />
                </div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                    {isLoading ? 'Accessing...' : <><Search className="mr-2 h-5 w-5" /> Access Records</>}
                </button>
            </form>
        </div>
    );
};

export default PatientSearchForm;