import { useState, useEffect, useRef } from 'react';
import { X, FileText, Plus } from 'lucide-react';
import { getUniversities, getCourses, createUniversity, createCourse, createExam, getUploadUrl, confirmUpload } from '@/lib/api';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuth } from '@/hooks/useAuth';
import type { University, Course, UploadFile } from '@/types';

interface UploadPageProps {
  onNavigate: (page: 'home') => void;
}

export function UploadPage({ onNavigate }: UploadPageProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [, setIsLoading] = useState(false);
  const [showNewUniversity, setShowNewUniversity] = useState(false);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newUniversityName, setNewUniversityName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  
  // Form data
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [examType, setExamType] = useState<'Mid' | 'Final' | 'Quiz' | 'Other'>('Mid');
  const [teacherName, setTeacherName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { hapticFeedback, showMainButton, hideMainButton, setMainButtonLoading, showAlert } = useTelegram();
  useAuth(); // Ensures user is authenticated

  useEffect(() => {
    const loadData = async () => {
      try {
        const [uniRes, courseRes] = await Promise.all([
          getUniversities(),
          getCourses(),
        ]);
        setUniversities(uniRes.universities);
        setCourses(courseRes.courses);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  // Setup main button
  useEffect(() => {
    const canSubmit = selectedUniversity && selectedCourse && year && examType && files.length > 0;
    
    if (canSubmit) {
      showMainButton('Upload Exam', handleSubmit, {
        color: 'var(--tg-button-color)',
        textColor: 'var(--tg-button-text-color)',
      });
    } else {
      hideMainButton();
    }

    return () => {
      hideMainButton();
    };
  }, [selectedUniversity, selectedCourse, year, examType, files]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = [];
    Array.from(selectedFiles).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      
      if (!isImage && !isPDF) return;

      const preview = isImage ? URL.createObjectURL(file) : '';
      newFiles.push({
        file,
        preview,
        uploading: false,
        progress: 0,
      });
    });

    setFiles(prev => [...prev, ...newFiles]);
    hapticFeedback('light');
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
    hapticFeedback('light');
  };

  const uploadFileToStorage = async (uploadFile: UploadFile, index: number): Promise<string> => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles[index].uploading = true;
      return newFiles;
    });

    try {
      // Get upload URL
      const { signed_url, path } = await getUploadUrl(
        uploadFile.file.name,
        uploadFile.file.type
      );

      // Upload file
      const response = await fetch(signed_url, {
        method: 'PUT',
        body: uploadFile.file,
        headers: {
          'Content-Type': uploadFile.file.type,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Get public URL
      const { url } = await confirmUpload(path);

      setFiles(prev => {
        const newFiles = [...prev];
        newFiles[index].uploading = false;
        newFiles[index].progress = 100;
        newFiles[index].url = url;
        return newFiles;
      });

      return url;
    } catch (error) {
      setFiles(prev => {
        const newFiles = [...prev];
        newFiles[index].uploading = false;
        return newFiles;
      });
      throw error;
    }
  };

  const handleAddUniversity = async () => {
    if (!newUniversityName.trim()) return;
    
    try {
      const response = await createUniversity(newUniversityName.trim());
      setUniversities(prev => [...prev, response.university]);
      setSelectedUniversity(response.university.id);
      setNewUniversityName('');
      setShowNewUniversity(false);
      hapticFeedback('success');
    } catch (error) {
      showAlert('Failed to add university');
    }
  };

  const handleAddCourse = async () => {
    if (!newCourseName.trim()) return;
    
    try {
      const response = await createCourse(newCourseName.trim());
      setCourses(prev => [...prev, response.course]);
      setSelectedCourse(response.course.id);
      setNewCourseName('');
      setShowNewCourse(false);
      hapticFeedback('success');
    } catch (error) {
      showAlert('Failed to add course');
    }
  };

  const handleSubmit = async () => {
    if (!selectedUniversity || !selectedCourse || !year || !examType || files.length === 0) {
      showAlert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setMainButtonLoading(true);

    try {
      // Upload all files
      const fileUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFileToStorage(files[i], i);
        fileUrls.push(url);
      }

      // Create exam
      await createExam({
        university_id: selectedUniversity,
        course_id: selectedCourse,
        year: parseInt(year),
        exam_type: examType,
        teacher_name: teacherName,
        files: fileUrls,
      });

      hapticFeedback('success');
      showAlert('Exam uploaded successfully!');
      onNavigate('home');
    } catch (error) {
      console.error('Upload error:', error);
      showAlert('Failed to upload exam. Please try again.');
    } finally {
      setIsLoading(false);
      setMainButtonLoading(false);
    }
  };

  return (
    <div className="page-container upload-page">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">Upload Exam</h1>
      </header>

      {/* File Upload */}
      <div className="card">
        <h2 className="card-title">Exam Files *</h2>
        <p className="card-subtitle">Upload PDF or images</p>
        
        <div className="file-upload-area">
          {files.length > 0 && (
            <div className="file-preview-grid">
              {files.map((file, index) => (
                <div key={index} className="file-preview-item">
                  {file.preview ? (
                    <img src={file.preview} alt="Preview" />
                  ) : (
                    <div className="file-preview-pdf">
                      <FileText size={32} />
                      <span>PDF</span>
                    </div>
                  )}
                  {file.uploading && (
                    <div className="file-upload-progress">
                      <div className="spinner" />
                    </div>
                  )}
                  <button 
                    className="file-preview-remove"
                    onClick={() => removeFile(index)}
                    disabled={file.uploading}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <button 
            className="file-upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus size={24} />
            <span>Add Files</span>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Exam Details */}
      <div className="card">
        <h2 className="card-title">Exam Details</h2>
        
        {/* University */}
        <div className="form-group">
          <label className="form-label">University *</label>
          {!showNewUniversity ? (
            <div className="select-with-add">
              <select 
                className="form-select"
                value={selectedUniversity}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setShowNewUniversity(true);
                  } else {
                    setSelectedUniversity(e.target.value);
                  }
                }}
              >
                <option value="">Select University</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>{uni.name}</option>
                ))}
                <option value="new">+ Add New University</option>
              </select>
            </div>
          ) : (
            <div className="add-new-input">
              <input
                type="text"
                className="form-input"
                placeholder="Enter university name"
                value={newUniversityName}
                onChange={(e) => setNewUniversityName(e.target.value)}
                autoFocus
              />
              <div className="add-new-actions">
                <button className="btn btn-sm btn-primary" onClick={handleAddUniversity}>
                  Add
                </button>
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={() => setShowNewUniversity(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Course */}
        <div className="form-group">
          <label className="form-label">Course *</label>
          {!showNewCourse ? (
            <div className="select-with-add">
              <select 
                className="form-select"
                value={selectedCourse}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setShowNewCourse(true);
                  } else {
                    setSelectedCourse(e.target.value);
                  }
                }}
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
                <option value="new">+ Add New Course</option>
              </select>
            </div>
          ) : (
            <div className="add-new-input">
              <input
                type="text"
                className="form-input"
                placeholder="Enter course name"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                autoFocus
              />
              <div className="add-new-actions">
                <button className="btn btn-sm btn-primary" onClick={handleAddCourse}>
                  Add
                </button>
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={() => setShowNewCourse(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Year */}
        <div className="form-group">
          <label className="form-label">Year *</label>
          <select 
            className="form-select"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Exam Type */}
        <div className="form-group">
          <label className="form-label">Exam Type *</label>
          <div className="exam-type-buttons">
            {(['Mid', 'Final', 'Quiz', 'Other'] as const).map((type) => (
              <button
                key={type}
                className={`exam-type-btn ${examType === type ? 'active' : ''}`}
                onClick={() => setExamType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Teacher Name */}
        <div className="form-group">
          <label className="form-label">Teacher Name (Optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter teacher name"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
