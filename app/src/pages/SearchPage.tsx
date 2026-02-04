import { useState, useEffect, useCallback } from 'react';
import { Search, X, Building2, BookOpen, Calendar } from 'lucide-react';
import { getExams, getUniversities, getCourses } from '@/lib/api';
import { useTelegram } from '@/hooks/useTelegram';
import { ExamCard } from '@/components/ExamCard';
import type { Exam, University, Course } from '@/types';

interface SearchPageProps {
  onNavigate: (page: 'exam-detail' | 'user-profile', params: { examId?: string; userId?: string }) => void;
}

export function SearchPage({ onNavigate }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  const { hapticFeedback } = useTelegram();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [uniRes, courseRes] = await Promise.all([
          getUniversities(),
          getCourses(),
        ]);
        setUniversities(uniRes.universities);
        setCourses(courseRes.courses);
      } catch (error) {
        console.error('Failed to load filters:', error);
      }
    };
    loadFilters();
  }, []);

  const searchExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getExams({
        search: searchQuery || undefined,
        university_id: selectedUniversity || undefined,
        course_id: selectedCourse || undefined,
        year: selectedYear ? parseInt(selectedYear) : undefined,
      });
      setExams(response.exams);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedUniversity, selectedCourse, selectedYear]);

  useEffect(() => {
    const timeout = setTimeout(searchExams, 300);
    return () => clearTimeout(timeout);
  }, [searchExams]);

  const clearFilters = () => {
    hapticFeedback('light');
    setSelectedUniversity('');
    setSelectedCourse('');
    setSelectedYear('');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedUniversity || selectedCourse || selectedYear;

  return (
    <div className="page-container search-page">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">Search Exams</h1>
      </header>

      {/* Search Input */}
      <div className="search-container">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="search-input"
          placeholder="Search by course or teacher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="search-clear"
            onClick={() => setSearchQuery('')}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="filter-bar">
        <button 
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
          {hasActiveFilters && <span className="filter-badge" />}
        </button>
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear all
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="filters-panel">
          <div className="form-group">
            <label className="form-label">
              <Building2 size={14} /> University
            </label>
            <select 
              className="form-select"
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
            >
              <option value="">All Universities</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>{uni.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <BookOpen size={14} /> Course
            </label>
            <select 
              className="form-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Calendar size={14} /> Year
            </label>
            <select 
              className="form-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="search-results">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : exams.length > 0 ? (
          <>
            <p className="results-count">{exams.length} exam{exams.length !== 1 ? 's' : ''} found</p>
            <div className="exams-list">
              {exams.map((exam) => (
                <ExamCard 
                  key={exam.id} 
                  exam={exam} 
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <Search size={48} className="empty-state-icon" />
            <h3 className="empty-state-title">No exams found</h3>
            <p className="empty-state-description">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
