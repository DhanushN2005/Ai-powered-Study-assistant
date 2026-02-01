import React, { useState, useEffect } from 'react';
import { Upload, Users, FileText, Loader, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { materialsAPI } from '../utils/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5006/api';

const InstructorMaterials = () => {
    const [loading, setLoading] = useState(true);
    const [materials, setMaterials] = useState([]);
    const [students, setStudents] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [uploadData, setUploadData] = useState({
        title: '',
        subject: '',
        topic: '',
        file: null
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [materialsRes, studentsRes] = await Promise.all([
                materialsAPI.getAll(),
                axios.get(`${API_URL}/instructor/students`, config)
            ]);

            setMaterials(materialsRes.data.data);
            setStudents(studentsRes.data.data);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadData.file) {
            toast.error('Please select a file');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', uploadData.file);
            formData.append('title', uploadData.title);
            formData.append('subject', uploadData.subject);
            formData.append('topic', uploadData.topic);

            await materialsAPI.create(formData);
            toast.success('Material uploaded successfully!');
            setShowUploadModal(false);
            setUploadData({ title: '', subject: '', topic: '', file: null });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload material');
        } finally {
            setUploading(false);
        }
    };

    const handleAssign = async () => {
        if (selectedStudents.length === 0) {
            toast.error('Please select at least one student');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            await axios.post(
                `${API_URL}/instructor/assign-material`,
                {
                    materialId: selectedMaterial._id,
                    studentIds: selectedStudents
                },
                config
            );

            toast.success(`Material assigned to ${selectedStudents.length} student(s)`);
            setShowAssignModal(false);
            setSelectedMaterial(null);
            setSelectedStudents([]);
        } catch (error) {
            toast.error('Failed to assign material');
        }
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Materials</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Upload and assign materials to students</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Upload className="w-5 h-5" />
                    Upload Material
                </button>
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center transition-colors">
                        <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No materials yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Upload your first study material</p>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Upload Material
                        </button>
                    </div>
                ) : (
                    materials.map((material) => (
                        <div key={material._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all border border-transparent dark:border-gray-700">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{material.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{material.subject}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{material.topic}</p>
                                </div>
                                <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(material.createdAt).toLocaleDateString()}
                                </span>
                                <button
                                    onClick={() => {
                                        setSelectedMaterial(material);
                                        setShowAssignModal(true);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center gap-1"
                                >
                                    <Users className="w-4 h-4" />
                                    Assign
                                </button>
                            </div>

                            {material.assignedTo && material.assignedTo.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs text-gray-600">
                                        Assigned to {material.assignedTo.length} student(s)
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Material</h2>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={uploadData.title}
                                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="e.g., Chapter 1 - Introduction"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={uploadData.subject}
                                    onChange={(e) => setUploadData({ ...uploadData, subject: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="e.g., Mathematics"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Topic *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={uploadData.topic}
                                    onChange={(e) => setUploadData({ ...uploadData, topic: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="e.g., Calculus"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    File *
                                </label>
                                <input
                                    type="file"
                                    required
                                    accept=".pdf,.doc,.docx,.txt"
                                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, or TXT files</p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && selectedMaterial && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assign Material</h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedMaterial.title}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedMaterial(null);
                                    setSelectedStudents([]);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Select Students</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {students.map((student) => (
                                    <label
                                        key={student._id}
                                        className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                    >                                   <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(student._id)}
                                            onChange={() => toggleStudentSelection(student._id)}
                                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                                        </div>
                                        {selectedStudents.includes(student._id) && (
                                            <Check className="w-5 h-5 text-indigo-600" />
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t">
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedMaterial(null);
                                    setSelectedStudents([]);
                                }}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={selectedStudents.length === 0}
                                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                Assign to {selectedStudents.length} Student(s)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorMaterials;
