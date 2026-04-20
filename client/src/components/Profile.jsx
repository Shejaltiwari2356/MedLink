// client/src/components/Profile.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Edit, Save, X, Phone, MapPin, Mail, Calendar, Droplet } from 'lucide-react';

const apiClient = axios.create({
    baseURL: "http://localhost:5000/api",
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    // Add all editable fields to the initial formData state
    const [formData, setFormData] = useState({ 
        firstName: '', 
        lastName: '',
        bloodGroup: '',
        contact: '', 
        address: '' 
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiClient.get('/profile/me');
                setProfile(res.data);
                // Populate formData with all fields from the fetched profile
                setFormData({ 
                    firstName: res.data.firstName, 
                    lastName: res.data.lastName,
                    bloodGroup: res.data.bloodGroup,
                    contact: res.data.contact, 
                    address: res.data.address 
                });
            } catch (err) {
                setError('Failed to fetch profile data.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setMessage(''); 
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const res = await apiClient.put('/profile/me', formData);
            setProfile(res.data);
            setIsEditing(false);
            setMessage('Profile updated successfully!');
        } catch (err) {
            setError('Failed to update profile.');
        }
    };

    if (loading) return <p className="text-center">Loading profile...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    // A component for displaying static (non-editable) info
    const StaticDetailItem = ({ icon: Icon, label, value }) => (
        <div className="flex items-center space-x-4">
            <Icon className="w-6 h-6 text-gray-500 flex-shrink-0" />
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-lg text-gray-800">{value}</p>
            </div>
        </div>
    );

    // A component for displaying fields that can become inputs
    const EditableDetailItem = ({ label, name, value, icon: Icon, type = "text" }) => (
        <div className="flex items-center space-x-4">
            <Icon className="w-6 h-6 text-gray-500 flex-shrink-0" />
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                {isEditing ? (
                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={handleChange}
                        className="text-lg p-1 border-b-2 border-gray-300 focus:border-blue-500 outline-none w-full"
                    />
                ) : (
                    <p className="text-lg text-gray-800">{value}</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                    <User className="mr-3" size={32} /> My Profile
                </h2>
                {!isEditing && (
                    <button onClick={handleEditToggle} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                        <Edit className="mr-2" size={16} /> Edit Profile
                    </button>
                )}
            </div>

            {message && <div className="mb-4 p-3 text-center bg-green-100 text-green-700 rounded-lg">{message}</div>}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Static Fields */}
                    <StaticDetailItem label="Unique ID" value={profile.uniqueId} icon={User} />
                    <StaticDetailItem label="Email" value={profile.email} icon={Mail} />
                    <StaticDetailItem label="Date of Birth" value={new Date(profile.dob).toLocaleDateString()} icon={Calendar} />
                    <StaticDetailItem label="Gender" value={profile.gender} icon={User} />
                    
                    {/* Editable Fields */}
                    <EditableDetailItem label="First Name" name="firstName" value={formData.firstName} icon={User} />
                    <EditableDetailItem label="Last Name" name="lastName" value={formData.lastName} icon={User} />
                    <EditableDetailItem label="Blood Group" name="bloodGroup" value={formData.bloodGroup} icon={Droplet} />
                    <EditableDetailItem label="Contact Number" name="contact" value={formData.contact} icon={Phone} />

                    {/* Address is larger, so it gets its own logic */}
                     <div className="flex items-start space-x-4 md:col-span-2">
                        <MapPin className="w-6 h-6 text-gray-500 flex-shrink-0 mt-1" />
                        <div className="w-full">
                            <p className="text-sm font-medium text-gray-500">Address</p>
                            {isEditing ? (
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="text-lg p-1 border-b-2 border-gray-300 focus:border-blue-500 outline-none w-full"
                                    rows="2"
                                />
                            ) : (
                                <p className="text-lg text-gray-800">{profile.address}</p>
                            )}
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="mt-8 flex justify-end space-x-4">
                        <button type="button" onClick={handleEditToggle} className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
                            <X className="mr-2" size={16} /> Cancel
                        </button>
                        <button type="submit" className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                            <Save className="mr-2" size={16} /> Save Changes
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default Profile;