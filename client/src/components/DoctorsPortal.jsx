import React, { useState } from 'react';
import axios from 'axios';
import { User, ShieldCheck } from 'lucide-react';
import PatientSearchForm from './PatientSearchForm';
import PatientDataView from './PatientDataView';

// Create a reusable authenticated axios instance
const apiClient = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        'Content-Type': 'application/json'
    }
});

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));


const DoctorsPortal = () => {
  const [patientData, setPatientData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSearch = async ({ patientId, otp }) => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
        const response = await apiClient.post('/doctor-access/verify-otp', { patientId, otp });
        setPatientData(response.data);
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to verify OTP and fetch data.');
        setPatientData(null);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateOtp = async (patientId) => {
    if (!patientId) {
        setError('Please enter a Patient ID first.');
        return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
        const response = await apiClient.post('/doctor-access/generate-otp', { patientId });
        setMessage(response.data.message);
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to generate OTP.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    setPatientData(null);
    setError('');
    setMessage('');
  };

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                <ShieldCheck className="mr-3 text-indigo-600" size={32}/> Doctor's Portal
            </h2>
            <p className="mt-2 text-gray-600">Securely access patient records and manage consultations.</p>
        </div>
        
        {patientData ? (
            <PatientDataView patientData={patientData} onBack={handleBack} />
        ) : (
            <PatientSearchForm 
                onSearch={handleSearch} 
                onGenerateOtp={handleGenerateOtp}
                isLoading={isLoading}
                error={error}
                message={message}
            />
        )}
    </div>
  );
};

export default DoctorsPortal;