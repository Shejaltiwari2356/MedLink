import React, { useState } from 'react';
// Assuming you have these components already, we'll modify them to accept props
import ViewVitals from './ViewVitals';
import AnalyseVitals from './AnalyseVitals';
import BloodReports from './BloodReports';
import Prescription from './Prescription'; // We'll use your existing prescription component

const PatientDataView = ({ patientData, onBack }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const { profile, vitals, reports, prescriptions } = patientData;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'vitals':
                // IMPORTANT: You'd need to modify ViewVitals to accept a `vitals` prop
                // instead of fetching its own data.
                return <ViewVitals vitals={vitals} isHistoryView={true} />;
            case 'analysis':
                return <AnalyseVitals vitals={vitals} isHistoryView={true} />;
            case 'reports':
                return <BloodReports reports={reports} isHistoryView={true} />;
            case 'prescriptions':
                // Pass patientId to the Prescription component for the "Add" functionality
                return <Prescription prescriptions={prescriptions} patientIdForDoctor={profile.uniqueId} isHistoryView={true} />;
            case 'profile':
            default:
                return (
                    <div className="text-gray-700">
                        <p><strong>Name:</strong> {profile.firstName} {profile.lastName}</p>
                        <p><strong>Unique ID:</strong> {profile.uniqueId}</p>
                        <p><strong>Email:</strong> {profile.email}</p>
                        <p><strong>Contact:</strong> {profile.contact}</p>
                        <p><strong>DOB:</strong> {new Date(profile.dob).toLocaleDateString()}</p>
                        <p><strong>Blood Group:</strong> {profile.bloodGroup}</p>
                    </div>
                );
        }
    };

    const TabButton = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === tabName 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-bold">Patient Records: {profile.firstName} {profile.lastName}</h3>
                    <p className="text-gray-500">ID: {profile.uniqueId}</p>
                </div>
                <button onClick={onBack} className="text-indigo-600 hover:underline font-medium">&larr; Back to Search</button>
            </div>

            <div className="flex space-x-2 border-b mb-4">
                <TabButton tabName="profile" label="Profile" />
                <TabButton tabName="vitals" label="Vitals History" />
                <TabButton tabName="analysis" label="Vitals Analysis" />
                <TabButton tabName="reports" label="Blood Reports" />
                <TabButton tabName="prescriptions" label="Prescriptions" />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default PatientDataView;