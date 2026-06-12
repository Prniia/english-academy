/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit, Trash2, CheckCircle, XSquare, LogOut, Search, 
  Play, ChevronLeft, Award, Clock, History, AlertCircle, BookOpen, Settings, Users, ArrowRight, Menu, HelpCircle, X, Check, Eye
} from 'lucide-react';

export default function App() {
  // Navigation & User state
  const [currentPage, setCurrentPage] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  
  // Quiz taking state
  const [activeTest, setActiveTest] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [quizTimer, setQuizTimer] = useState(0); // in seconds
  const [quizIntervalId, setQuizIntervalId] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  // Lists & Catalogues
  const [testsCatalogFilter, setTestsCatalogFilter] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  
  // Admin Lists
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminPage, setAdminPage] = useState(1);
  const [adminTotalPages, setAdminTotalPages] = useState(1);
  const [adminTests, setAdminTests] = useState([]);

  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication Forms
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Admin New Test Modal or Form State
  const [showTestForm, setShowTestForm] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [testFormTitle, setTestFormTitle] = useState('');
  const [testFormDescription, setTestFormDescription] = useState('');
  const [testFormDuration, setTestFormDuration] = useState(30);
  const [testFormQuestions, setTestFormQuestions] = useState([
    { questionText: '', options: ['', ''], correctAnswerIndex: 0 }
  ]);

  // Handle API Requests Wrapper
  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    
    // Auto proxying standard calls
    const res = await fetch(endpoint, {
      ...options,
      headers
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'خطا در ارتباط با سرور');
    }
    return data;
  };

  // On App Mount: check token Validity
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      fetchTests();
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const data = await apiFetch('/api/users/me');
      setUser({
        id: data.user.id,
        fullName: data.user.fullName,
        username: data.user.username,
        role: data.user.role,
        isVerified: data.user.isVerified,
        level: data.user.level
      });
      fetchTests();
      fetchAttempts();
    } catch (err) {
      // Stale or invalid token
      handleLogout();
    }
  };

  const fetchTests = async () => {
    try {
      const data = await apiFetch('/api/tests');
      setTestsCatalogFilter(data);
      if (user && user.role === 'admin') {
        setAdminTests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttempts = async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/api/users/me/attempts');
      setMyAttempts(data.attempts);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch admin-only users list
  const fetchAdminUsers = async () => {
    try {
      const data = await apiFetch(`/api/users?page=${adminPage}&search=${adminSearch}`);
      setAdminUsers(data.users);
      setAdminTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentPage === 'admin') {
      fetchAdminUsers();
      fetchTests();
    }
  }, [currentPage, adminPage, adminSearch]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setMyAttempts([]);
    setQuizResult(null);
    setCurrentPage('home');
  };

  // Register and Login commands
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setSuccessMsg(data.message);
      
      // Setup current user details
      const authedUser = {
        id: data.user.id,
        fullName: data.user.fullName,
        username: data.user.username,
        role: data.user.role,
        isVerified: data.user.isVerified,
        level: data.user.level
      };
      setUser(authedUser);
      
      // Navigation
      if (authedUser.role === 'admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, username: registerUsername, password: registerPassword })
      });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setSuccessMsg(data.message);
      
      const authedUser = {
        id: data.user.id,
        fullName: data.user.fullName,
        username: data.user.username,
        role: data.user.role,
        isVerified: data.user.isVerified,
        level: data.user.level
      };
      setUser(authedUser);
      setCurrentPage('dashboard');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Pre-fill fields for easy evaluation
  const setQuickFill = (role) => {
    if (role === 'admin') {
      setLoginUsername('admin');
      setLoginPassword('admin123');
    } else {
      setLoginUsername('ali');
      setLoginPassword('user123');
    }
  };

  // Start placement test taking
  const startQuiz = async (test) => {
    try {
      // Fetch full details of the test (normal users will receive without corrective indexes)
      const testDetails = await apiFetch(`/api/tests/${test._id}`);
      setActiveTest(testDetails);
      setActiveQuestions(testDetails.questions);
      setSelectedAnswers(new Array(testDetails.questions.length).fill(-1));
      setCurrentQuestionIndex(0);
      setQuizTimer(testDetails.duration * 60);
      setQuizResult(null);
      setCurrentPage('test-taking');

      // Setup countdown interval
      if (quizIntervalId) clearInterval(quizIntervalId);
      const timer = setInterval(() => {
        setQuizTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Trigger automatic submission when time's up
            submitQuizAnswers(testDetails._id, new Array(testDetails.questions.length).fill(0));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setQuizIntervalId(timer);
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit test answers to server
  const submitQuizAnswers = async (testId, answers) => {
    if (quizIntervalId) {
      clearInterval(quizIntervalId);
      setQuizIntervalId(null);
    }
    
    // Fill unselected answers with 0
    const finalAnswers = selectedAnswers.map(ans => idxAdjuster(ans));

    try {
      const data = await apiFetch('/api/attempts/submit', {
        method: 'POST',
        body: JSON.stringify({
          testId,
          answers: finalAnswers
        })
      });
      setQuizResult(data.result);
      
      // Refresh attempts & profile level if user is logged in
      if (token) {
        fetchCurrentUser();
      }
    } catch (err) {
      alert(err.message || 'خطا در ثبت نمره آزمون');
    }
  };

  const idxAdjuster = (val) => {
    return val === -1 ? 0 : val;
  };

  const toPersianDigits = (str) => {
    if (str === undefined || str === null) return '';
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/\d/g, d => persianDigits[parseInt(d)]);
  };

  const formatTimer = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    const mStr = minutes.toString().padStart(2, '0');
    const sStr = seconds.toString().padStart(2, '0');
    return `${toPersianDigits(mStr)}:${toPersianDigits(sStr)}`;
  };

  // ==========================================
  // ADMIN CONSOLE ACTIONS FOR USER MANAGEMENT
  // ==========================================

  const toggleUserRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await apiFetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole })
      });
      fetchAdminUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleUserVerificationStatus = async (userId, currentStatus) => {
    try {
      await apiFetch(`/api/users/${userId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ isVerified: !currentStatus })
      });
      fetchAdminUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const overrideUserLevelCode = async (userId, newLevelCode) => {
    try {
      await apiFetch(`/api/users/${userId}/level`, {
        method: 'PATCH',
        body: JSON.stringify({ level: newLevelCode })
      });
      fetchAdminUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteUserFromPlatform = async (userId) => {
    if (!confirm('آیا از حذف دائمی این کاربر از پایگاه داده اطمینان دارید؟ تمامی رکوردهای نمره وی پاک می‌شوند.')) return;
    try {
      const data = await apiFetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      alert(data.message);
      fetchAdminUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================
  // ADMIN CONSOLE ACTIONS FOR TEST MANAGEMENT
  // ==========================================

  const deleteTestFromPlatform = async (testId) => {
    if (!confirm('آیا از حذف این آزمون به همراه رکوردهای تلاش آن مطمئن هستید؟')) return;
    try {
      const data = await apiFetch(`/api/tests/${testId}`, {
        method: 'DELETE'
      });
      alert(data.message);
      fetchTests();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleTestActivation = async (testId) => {
    try {
      await apiFetch(`/api/tests/${testId}/toggle`, {
        method: 'PATCH'
      });
      fetchTests();
    } catch (err) {
      alert(err.message);
    }
  };

  const triggerAddOrEditForm = (test) => {
    if (test) {
      // Editing existing test
      setEditingTestId(test._id);
      setTestFormTitle(test.title);
      setTestFormDescription(test.description);
      setTestFormDuration(test.duration);
      setTestFormQuestions(JSON.parse(JSON.stringify(test.questions)));// Deep clone
    } else {
      // Adding new test
      setEditingTestId(null);
      setTestFormTitle('');
      setTestFormDescription('');
      setTestFormDuration(30);
      setTestFormQuestions([
        { questionText: '', options: ['', ''], correctAnswerIndex: 0 }
      ]);
    }
    setShowTestForm(true);
  };

  const saveTestForm = async (e) => {
    e.preventDefault();
    
    // Simple frontend validations
    if (!testFormTitle.trim()) {
      alert('لطفاً عنوان آزمون را وارد کنید');
      return;
    }
    
    try {
      if (editingTestId) {
        // Edit test API path
        await apiFetch(`/api/tests/${editingTestId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: testFormTitle,
            description: testFormDescription,
            duration: testFormDuration,
            questions: testFormQuestions
          })
        });
        alert('آزمون با موفقیت بروزرسانی شد');
      } else {
        // Create test API path
        await apiFetch('/api/tests', {
          method: 'POST',
          body: JSON.stringify({
            title: testFormTitle,
            description: testFormDescription,
            duration: testFormDuration,
            questions: testFormQuestions
          })
        });
        alert('آزمون جدید با موفقیت ساخته شد');
      }
      setShowTestForm(false);
      fetchTests();
    } catch (err) {
      alert(err.message);
    }
  };

  const updateQuestionTextVal = (qIdx, val) => {
    const updated = [...testFormQuestions];
    updated[qIdx].questionText = val;
    setTestFormQuestions(updated);
  };

  const updateQuestionOptionVal = (qIdx, oIdx, val) => {
    const updated = [...testFormQuestions];
    updated[qIdx].options[oIdx] = val;
    setTestFormQuestions(updated);
  };

  const addOptionToFormQuestion = (qIdx) => {
    const updated = [...testFormQuestions];
    updated[qIdx].options.push('');
    setTestFormQuestions(updated);
  };

  const removeOptionFromFormQuestion = (qIdx, oIdx) => {
    const updated = [...testFormQuestions];
    if (updated[qIdx].options.length <= 2) {
      alert('هر گزینه باید حداقل ۲ جواب داشته باشد');
      return;
    }
    updated[qIdx].options.splice(oIdx, 1);
    // Correct indices limits
    if (updated[qIdx].correctAnswerIndex >= updated[qIdx].options.length) {
      updated[qIdx].correctAnswerIndex = 0;
    }
    setTestFormQuestions(updated);
  };

  const addFormQuestionRow = () => {
    setTestFormQuestions([
      ...testFormQuestions,
      { questionText: '', options: ['', ''], correctAnswerIndex: 0 }
    ]);
  };

  const removeFormQuestionRow = (qIdx) => {
    if (testFormQuestions.length <= 1) {
      alert('آزمون باید حداقل دارای ۱ سوال باشد');
      return;
    }
    const updated = [...testFormQuestions];
    updated.splice(qIdx, 1);
    setTestFormQuestions(updated);
  };

  const handleSelectCorrectIndex = (qIdx, val) => {
    const updated = [...testFormQuestions];
    updated[qIdx].correctAnswerIndex = val;
    setTestFormQuestions(updated);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f9f9ff] text-[#121c2a]" dir="rtl">
      
      {/* ==========================================
          TOP NAVIGATION BAR
          ========================================== */}
      <nav className="bg-white border-b border-[#c5c5d3]/40 sticky top-0 z-50 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto w-full">
          
          {/* Logo & Links */}
          <div className="flex items-center gap-10">
            <span 
              onClick={() => setCurrentPage('home')} 
              className="text-2xl font-bold text-[#00236f] cursor-pointer tracking-tight"
            >
              English Pro
            </span>
            <ul className="hidden md:flex gap-8 items-center">
              <li>
                <button 
                  onClick={() => setCurrentPage('home')} 
                  className={`font-semibold transition-colors py-1 ${currentPage === 'home' ? 'text-[#00236f] border-b-2 border-[#00236f]' : 'text-[#444651] hover:text-[#0058be]'}`}
                >
                  صفحه اصلی
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    if (token) {
                      setCurrentPage(user?.role === 'admin' ? 'admin' : 'dashboard');
                    } else {
                      setAuthMode('login');
                      setCurrentPage('login');
                    }
                  }} 
                  className={`font-semibold transition-colors py-1 ${['dashboard', 'admin'].includes(currentPage) ? 'text-[#00236f] border-b-2 border-[#00236f]' : 'text-[#444651] hover:text-[#0058be]'}`}
                >
                  پنل کاربری
                </button>
              </li>
            </ul>
          </div>

          {/* User Section (Right) */}
          <div className="hidden md:flex gap-4 items-center">
            {token && user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#444651]">
                  حساب کاربری: <strong className="text-[#00236f]">{user.fullName}</strong> 
                  {user.role === 'admin' && <span className="bg-[#ffdad6] text-[#93000a] text-xs px-2.5 py-0.5 rounded-full mr-2 font-semibold">مدیر</span>}
                </span>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-[#ba1a1a] hover:bg-[#ffdad6]/20 px-3.5 py-1.5 rounded-lg border border-[#ba1a1a]/30 transition-all font-semibold text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  خروج
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setCurrentPage('login');
                  }} 
                  className="font-bold text-sm text-[#0058be] border border-[#0058be] px-5 py-2 rounded-lg hover:bg-[#d9e3f7] transition-colors"
                >
                  ورود به سایت
                </button>
                <button 
                  onClick={() => {
                    setAuthMode('register');
                    setCurrentPage('login');
                  }} 
                  className="font-bold text-sm bg-[#00236f] text-white px-5 py-2 rounded-lg hover:bg-[#1e3a8a] transition-all"
                >
                  ثبت نام جدید
                </button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#444651] p-2 hover:bg-[#d9e3f7]/50 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-b border-[#c5c5d3]/40 p-4 absolute top-[64px] left-0 w-full z-40 shadow-lg flex flex-col gap-4"
          >
            <button 
              onClick={() => {
                setCurrentPage('home');
                setMobileMenuOpen(false);
              }}
              className="text-right py-2 font-semibold text-[#444651] border-b border-gray-100"
            >
              صفحه اصلی
            </button>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                if (token) {
                  setCurrentPage(user?.role === 'admin' ? 'admin' : 'dashboard');
                } else {
                  setAuthMode('login');
                  setCurrentPage('login');
                }
              }}
              className="text-right py-2 font-semibold text-[#444651] border-b border-gray-100"
            >
              پنل کاربری
            </button>
            
            {token && user ? (
              <div className="flex flex-col gap-3 pt-2">
                <span className="text-sm font-medium text-[#444651]">
                  خوش آمدید، <strong className="text-[#00236f]">{user.fullName}</strong>
                </span>
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-[#ba1a1a] bg-[#ffdad6]/20 py-2 rounded-lg font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  خروج از حساب
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setCurrentPage('login');
                    setMobileMenuOpen(false);
                  }} 
                  className="flex-1 text-center font-bold text-sm text-[#0058be] border border-[#0058be] py-2 rounded-lg"
                >
                  ورود
                </button>
                <button 
                  onClick={() => {
                    setAuthMode('register');
                    setCurrentPage('login');
                    setMobileMenuOpen(false);
                  }} 
                  className="flex-1 text-center font-bold text-sm bg-[#00236f] text-white py-2 rounded-lg"
                >
                  ثبت نام
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MAIN VIEWS CANVAS
          ========================================== */}
      <main className="flex-grow flex flex-col">
        
        {/* VIEW 1: HOME PAGE */}
        {currentPage === 'home' && (
          <div className="w-full">
            
            {/* Hero Section */}
            <section className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center flex flex-col items-center gap-8">
              <span className="bg-[#dce1ff] text-[#001c4e] text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
                English Pro Placement System
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-[#00236f] leading-tight max-w-2xl tracking-tight">
                تعیین سطح دقیق، <br className="hidden md:inline" />
                مسیر روشن یادگیری
              </h1>
              <p className="text-[#444651] text-lg md:text-xl max-w-2xl leading-relaxed">
                آزمون تعیین سطح English Pro با بهره‌گیری از استانداردهای بین‌المللی، سطح زبان شما را در کوتاه‌ترین زمان و با بالاترین دقت ارزیابی می‌کند. همین حالا شروع کنید و مسیر یادگیری خود را شخصی‌سازی کنید.
              </p>
              
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                {testsCatalogFilter.length > 0 ? (
                  <button 
                    onClick={() => startQuiz(testsCatalogFilter[0])}
                    className="flex items-center justify-center gap-2 bg-[#00236f] text-white text-lg font-bold px-8 py-4 rounded-full shadow-lg hover:bg-[#1e3a8a] transform hover:scale-[1.03] transition-all"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    شروع سریع آزمون تعیین سطح
                  </button>
                ) : (
                  <button 
                    disabled
                    className="flex items-center justify-center gap-2 bg-gray-300 text-gray-500 text-lg font-bold px-8 py-4 rounded-full"
                  >
                    در حال بارگذاری آزمون‌ها...
                  </button>
                )}
                
                {!token && (
                  <button 
                    onClick={() => {
                      setAuthMode('login');
                      setCurrentPage('login');
                    }}
                    className="bg-white text-[#00236f] border border-[#00236f]/30 text-lg font-semibold px-8 py-4 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    ورود / ثبت‌نام پنل کاربری
                  </button>
                )}
              </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-6 pb-20 w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white border border-[#c5c5d3]/40 rounded-2xl p-8 shadow-sm flex flex-col justify-between gap-6 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-[#ffdad6] text-[#93000a] rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[26px]">no_accounts</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#00236f] mb-3">پشتیبانی از ورود مهمان</h3>
                    <p className="text-[#444651] leading-relaxed text-sm">
                      بدون نیاز به ثبت‌نام در آزمون شرکت کنید. ساخت حساب کاربری اختیاری است و می‌توانید بلافاصله ارزیابی خود را شروع کنید.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#c5c5d3]/40 rounded-2xl p-8 shadow-sm flex flex-col md:col-span-2 relative overflow-hidden group hover:shadow-md transition-shadow min-h-[250px]">
                  {/* Blueprint Grid pattern in SVG */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#1e3a8a_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
                  
                  <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                    <div className="w-12 h-12 bg-[#6ffbbe] text-[#005236] rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[28px]">verified</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#00236f] mb-3">دقت بالا بر اساس استانداردهای جهانی (CEFR)</h3>
                      <p className="text-[#444651] leading-relaxed max-w-xl text-base">
                        سوالات ما توسط متخصصین آموزش زبان طراحی شده‌اند تا مهارت‌های شما را در درک مطلب، گرامر و واژگان با دقتی بی‌نظیر بسنجند. محیط آزمون بدون استرس و تمرکز محور طراحی شده است.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#c5c5d3]/40 rounded-2xl p-8 shadow-sm flex flex-col justify-between gap-6 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-[#dce1ff] text-[#00164e] rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[26px]">bolt</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#00236f] mb-3">نتایج فوری و تحلیل دقیق</h3>
                    <p className="text-[#444651] leading-relaxed text-sm">
                      بلافاصله پس از اتمام آزمون، نمره خود را دریافت کنید و نقاط ضعف و قوت خود را در قالب یک گزارش تحلیلی مشاهده نمایید.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#c5c5d3]/40 rounded-2xl p-8 shadow-sm flex flex-col md:col-span-2 justify-between gap-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <h3 className="text-xl font-bold text-[#00236f] mb-2">لیست آزمون‌های فعال در سامانه</h3>
                      <p className="text-[#444651] text-sm">جهت ارزیابی تخصص‌های مختلف زبانی ما موارد متعددی طراحی نموده‌ایم.</p>
                    </div>
                    <span className="bg-[#eff3ff] text-[#00236f] text-xs font-bold px-3.5 py-1.5 rounded-full">
                      تعداد: {testsCatalogFilter.length} آزمون فعال
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    {testsCatalogFilter.map(test => (
                      <div key={test._id} className="border border-gray-100 p-4 rounded-xl bg-gray-50 flex flex-col justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-sm text-[#00236f]">{test.title}</h4>
                          <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {test.duration} دقیقه
                          </span>
                        </div>
                        <button 
                          onClick={() => startQuiz(test)} 
                          className="text-xs font-bold text-[#0058be] hover:underline"
                        >
                          شروع آزمون ←
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: LOGIN / REGISTER */}
        {currentPage === 'login' && (
          <div className="max-w-md w-full mx-auto px-6 py-12 flex flex-col gap-6">
            
            {/* Direct Fill Accounts Widget */}
            <div className="bg-white border border-[#c5c5d3]/40 p-4 rounded-2xl shadow-sm text-center">
              <span className="text-xs text-[#444651] font-semibold block mb-3">
                تست سریع جهت مدرس / دانشجو (بدون نیاز به ثبت نام):
              </span>
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => setQuickFill('admin')}
                  className="bg-[#ffdad6] text-[#93000a] text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-[#ffdad6]/80 transition-colors"
                >
                  ورود سریع به پنل ادمین
                </button>
                <button 
                  onClick={() => setQuickFill('user')}
                  className="bg-[#dce1ff] text-[#00164e] text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-[#dce1ff]/80 transition-all font-sans"
                >
                  ورود سریع به پنل کاربر
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#c5c5d3]/40 rounded-2xl p-8 shadow-sm flex flex-col gap-6">
              
              {/* Tabs */}
              <div className="flex border-b border-[#c5c5d3]/30">
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 text-center pb-3 font-bold text-lg transition-colors ${authMode === 'login' ? 'text-[#00236f] border-b-2 border-[#00236f]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  ورود به سایت
                </button>
                <button 
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 text-center pb-3 font-bold text-lg transition-colors ${authMode === 'register' ? 'text-[#00236f] border-b-2 border-[#00236f]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  ثبت نام سریع
                </button>
              </div>

              {/* Status messages */}
              {errorMsg && (
                <div className="bg-[#ffdad6] text-[#93000a] text-sm p-3.5 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="bg-[#6ffbbe]/25 text-[#005236] text-sm p-3.5 rounded-xl flex items-center gap-2 font-medium">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Login mode */}
              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#444651] mb-1.5">نام کاربری</label>
                    <input 
                      type="text" 
                      required
                      placeholder="username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full bg-[#f9f9ff] border border-[#c5c5d3] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] text-right text-[#121c2a]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#444651] mb-1.5">رمز عبور</label>
                    <input 
                      type="password" 
                      required
                      placeholder="******"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-[#f9f9ff] border border-[#c5c5d3] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] text-right"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-[#00236f] text-white py-3 rounded-lg font-bold text-base hover:bg-[#1e3a8a] transition-all mt-2"
                  >
                    ورود به حساب کاربری
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#444651] mb-1.5">نام و نام خانوادگی</label>
                    <input 
                      type="text" 
                      required
                      placeholder="امیرحسین عباسی"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#f9f9ff] border border-[#c5c5d3] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#444651] mb-1.5">نام کاربری دلخواه</label>
                    <input 
                      type="text" 
                      required
                      placeholder="user123"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className="w-full bg-[#f9f9ff] border border-[#c5c5d3] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#444651] mb-1.5">حداقل ۶ کاراکتر رمز عبور</label>
                    <input 
                      type="password" 
                      required
                      placeholder="******"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full bg-[#f9f9ff] border border-[#c5c5d3] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] text-right"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-[#0058be] text-white py-3 rounded-lg font-bold text-base hover:bg-[#004395] transition-all mt-2"
                  >
                    ثبت نام و ایجاد حساب
                  </button>
                </form>
              )}

            </div>
          </div>
        )}

        {/* VIEW 3: PLACEMENT TEST ENVIRONMENT */}
        {currentPage === 'test-taking' && activeTest && (
          <div className="max-w-4xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
            
            {/* Result presentation modal */}
            {quizResult ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-[#c5c5d3]/40 rounded-2xl p-8 shadow-md text-center flex flex-col items-center gap-6"
              >
                <div className="w-16 h-16 bg-[#eff3ff] text-[#00236f] rounded-full flex items-center justify-center">
                  <Award className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#00236f]">آزمون با موفقیت ثبت شد</h2>
                  <p className="text-gray-500 mt-2">پاسخ‌های شما توسط سیستم تصحیح گردید.</p>
                </div>
                
                {/* Visual score details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl mt-4">
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">تعداد کل پاسخ‌ها</span>
                    <span className="text-xl font-bold text-[#121c2a]">{toPersianDigits(activeQuestions.length)} سوال</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">پاسخ‌های صحیح</span>
                    <span className="text-xl font-bold text-[#005236]">{toPersianDigits(quizResult.correctAnswers)} صحیح</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">نمره نهایی شما</span>
                    <span className="text-3xl font-black text-[#00236f]" dir="ltr">%{toPersianDigits(quizResult.score)}</span>
                  </div>
                  <div className="bg-[#6ffbbe]/20 border border-[#6ffbbe]/30 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-xs text-[#002113] mb-1">سطح ارزیابی شده (CEFR)</span>
                    <span className="text-3xl font-black text-[#005236]">{quizResult.level}</span>
                  </div>
                </div>

                <div className="bg-[#eff3ff] p-4 rounded-xl border border-[#c5c5d3]/30 text-right max-w-xl">
                  <span className="font-bold text-sm text-[#00236f] block mb-1">برقراری ارتباط با سطح شما:</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    سطح ارزیابی شده شما <strong className="text-primary font-bold">{quizResult.level}</strong> می‌باشد. 
                    {quizResult.level.startsWith('A') && ' این سطح نشان‌دهنده‌ی آمادگی ابتدایی (Basic User) بوده و توصیه می‌شود روی اصول پایه‌ای گرامر و دایره واژگان ساده تمرکز کنید.'}
                    {quizResult.level.startsWith('B') && ' این سطح نشان‌دهنده‌ی آمادگی متوسط (Independent User) بوده و از مهارت‌های نسبتاً پایداری در مکالمات و فهم مطالب متنی برخوردارید.'}
                    {quizResult.level.startsWith('C') && ' تبریک! این سطح متعلق به کاربران حرفه‌ای (Proficient User) می‌باشد و دایره وسیعی از قوانین ساختاری و واژگان تخصصی را در اختیار دارید.'}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (token) {
                        setCurrentPage(user?.role === 'admin' ? 'admin' : 'dashboard');
                      } else {
                        setCurrentPage('home');
                      }
                    }}
                    className="bg-[#00236f] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#1e3a8a] transition-all"
                  >
                    انتقال به پنل کاربری
                  </button>
                  
                  {!token && (
                    <button 
                      onClick={() => {
                        setAuthMode('register');
                        setCurrentPage('login');
                      }}
                      className="border border-[#00236f] text-[#00236f] font-bold px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      جهت ذخیره همیشگی نمرات ثبت‌نام کنید
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <>
                {/* Timeline Header */}
                <div className="bg-white border border-[#c5c5d3]/45 rounded-2xl p-5 sticky top-[72px] z-30 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex flex-col gap-1 w-full md:w-2/3 text-right">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-[#00236f]">{activeTest.title}</span>
                      <span className="text-xs font-bold text-gray-400">
                        سوال {toPersianDigits(currentQuestionIndex + 1)} از {toPersianDigits(activeQuestions.length)}
                      </span>
                    </div>
                    {/* Progress Fill */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#00236f] h-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 bg-[#ffdad6] text-[#93000a] px-3.5 py-2 rounded-xl text-sm font-bold font-sans">
                      <Clock className="w-4 h-4" />
                      <span>زمان باقیمانده: {formatTimer(quizTimer)}</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('آیا از اتمام پاسخ‌دهی و ثبت نهایی آزمون اطمینان دارید؟')) {
                          submitQuizAnswers(activeTest._id, selectedAnswers);
                        }
                      }}
                      className="bg-[#00236f] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#1e3a8a] shadow-sm"
                    >
                      ثبت نهایی و اتمام آزمون
                    </button>
                  </div>
                </div>

                {/* Display Current Question */}
                <div className="bg-white border border-[#c5c5d3]/40 rounded-2xl p-8 shadow-sm flex flex-col gap-6">
                  
                  <div className="flex gap-3 justify-start items-start">
                    <span className="bg-[#eff3ff] text-[#00236f] text-sm font-black px-3 py-1 rounded-lg">
                      {toPersianDigits(currentQuestionIndex + 1)}
                    </span>
                    <h3 className="text-xl font-bold font-mono text-left leading-relaxed text-[#121c2a] flex-grow" dir="ltr">
                      {activeQuestions[currentQuestionIndex]?.questionText}
                    </h3>
                  </div>

                  {/* Options Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {activeQuestions[currentQuestionIndex]?.options.map((option, idx) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                      return (
                        <button 
                          key={idx}
                          onClick={() => {
                            const updated = [...selectedAnswers];
                            updated[currentQuestionIndex] = idx;
                            setSelectedAnswers(updated);
                          }}
                          className={`flex items-center gap-3 border p-4 rounded-xl text-left font-mono text-sm transition-all focus:outline-none ${
                            isSelected 
                              ? 'bg-[#dce1ff] text-[#001c4e] border-[#00236f] font-bold shadow-sm' 
                              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                          }`}
                          dir="ltr"
                        >
                          <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                            isSelected ? 'bg-[#00236f] text-white border-[#00236f]' : 'bg-gray-50 border-gray-300 text-gray-500'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-grow">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Footer */}
                  <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-4">
                    <button 
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      className="flex items-center gap-1 text-[#00236f] bg-[#eff3ff] text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-40 hover:bg-[#dce1ff]"
                    >
                      <ChevronLeft className="w-5 h-5 rotate-180" />
                      سوال قبلی
                    </button>

                    <span className="text-xs text-gray-400 font-semibold">
                      سوال {toPersianDigits(currentQuestionIndex + 1)} از {toPersianDigits(activeQuestions.length)}
                    </span>

                    {currentQuestionIndex < activeQuestions.length - 1 ? (
                      <button 
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="flex items-center gap-1 text-[#00236f] bg-[#eff3ff] text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#dce1ff]"
                      >
                        سوال بعدی
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          if (confirm('شما به سوال آخر رسیده‌اید. آیا مایل به ثبت نهایی و دریافت نتیجه هستید؟')) {
                            submitQuizAnswers(activeTest._id, selectedAnswers);
                          }
                        }}
                        className="bg-[#005236] text-white text-sm font-bold px-6 py-2 rounded-xl hover:bg-[#003823]"
                      >
                        ارسال و پایان آزمون
                      </button>
                    )}
                  </div>

                </div>

                <div className="bg-[#eff3ff]/50 border border-[#c5c5d3]/30 rounded-2xl p-4 flex gap-3 text-right">
                  <AlertCircle className="w-5 h-5 text-[#00236f] shrink-0" />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    در صورت قطع ناگهانی اینترنت یا بستن صفحه مرورگر، آزمون ملغی شده و راندمان تعیین سطح ثبت نخواهد شد. توصیه می‌گردد پیش از کلیک نهایی تمام گزینه‌ها را به دقت پر نمایید.
                  </p>
                </div>
              </>
            )}

          </div>
        )}

        {/* VIEW 4: STUDENT DASHBOARD */}
        {currentPage === 'dashboard' && user && (
          <div className="max-w-7xl mx-auto px-6 py-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Sidebar Details panel */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Profile card */}
              <div className="bg-white border border-[#c5c5d3]/40 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-[#dce1ff] text-[#001c4e] rounded-full flex items-center justify-center font-bold text-2xl">
                  {user.fullName.substring(0, 1)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#00236f]">{user.fullName}</h3>
                  <span className="text-xs text-gray-400 mt-1 block">نام کاربری: {user.username}</span>
                </div>
                
                {/* Visual Level indicator */}
                <div className="bg-[#eff3ff] border border-[#c5c5d3]/30 w-full p-4 rounded-xl flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">سطح زبان شما</span>
                  <span className="bg-[#00236f] text-white text-base font-black px-4 py-1.5 rounded-lg">
                    {user.level || 'نامشخص'}
                  </span>
                </div>

                <div className="w-full border-t border-gray-100 pt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-400">وضعیت حساب:</span>
                  <span className={`font-semibold ${user.isVerified ? 'text-green-600' : 'text-amber-600'}`}>
                    {user.isVerified ? 'حساب کاربری فعال' : 'در انتظار تایید مدیریت'}
                  </span>
                </div>
              </div>

              {/* Tips for progress */}
              <div className="bg-gradient-to-br from-[#00236f] to-[#0058be] text-white rounded-2xl p-6 shadow-md flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full pointer-events-none"></div>
                <BookOpen className="w-8 h-8" />
                <h4 className="font-bold text-base leading-snug">چگونه سطح زبان خود را بالا ببریم؟</h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  بر اساس استانداردهای بین‌المللی CEFR، تغییر از هر سطح به سطح بالاتر نیاز به حدود ۱۰۰ الی ۱۵۰ ساعت مطالعه فعال و تمرین ساختاریافته دارد. آزمون‌های این سامانه را به صورت ماهانه تکرار کنید تا روند پیشرفت خود را بسنجید.
                </p>
              </div>

            </div>

            {/* Dashboard main activity area (Right) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              
              {/* Take test launch banner */}
              <div className="bg-white border border-[#c5c5d3]/40 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1.5 text-right">
                  <h3 className="text-xl font-bold text-[#00236f]">برگزاری سنجش‌های مهارتی جدید</h3>
                  <p className="text-xs text-gray-500">آزمون مورد نظر خود را انتخاب کرده و بلافاصله تعیین سطح دقیق‌تر زبانی داشته باشید.</p>
                </div>
                <button 
                  onClick={() => setCurrentPage('home')}
                  className="bg-[#00236f] text-white hover:bg-[#1e3a8a] text-xs font-bold px-5 py-3 rounded-xl shadow-sm leading-none shrink-0"
                >
                  مشاهده کاتالوگ آزمون‌ها
                </button>
              </div>

              {/* History block */}
              <div className="bg-white border border-[#c5c5d3]/40 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <span className="font-bold text-base text-[#00236f] flex items-center gap-2">
                    <History className="w-5 h-5" />
                    تاریخچه تلاش‌ها و کارنامه‌ها
                  </span>
                  <span className="bg-gray-100 text-gray-600 font-bold text-xs px-3 py-1 rounded-full">
                    {toPersianDigits(myAttempts.length)} کارنامه ثبت شده
                  </span>
                </div>

                {myAttempts.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-gray-300 text-4xl">folder_off</span>
                    <span className="text-sm text-gray-400">تاکنون در آزمونی شرکت نکرده‌اید. با اولین آزمون نتایج در اینجا پدیدار می‌شوند.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-inner-right">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100 pb-2">
                          <th className="pb-3 text-right">عنوان آزمون</th>
                          <th className="pb-3 text-center">زمان ثبت</th>
                          <th className="pb-3 text-center">پاسخ‌های صحیح</th>
                          <th className="pb-3 text-center">نمره نهایی</th>
                          <th className="pb-3 text-center">سطح معادل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-sm">
                        {myAttempts.map(attempt => (
                          <tr key={attempt._id} className="hover:bg-gray-50/20 transition-colors">
                            <td className="py-3 font-bold text-[#00236f]">{attempt.testId?.title || 'آزمون عمومی'}</td>
                            <td className="py-3 text-center text-xs text-gray-500 font-sans" dir="ltr">
                              {new Date(attempt.createdAt).toLocaleDateString('fa-IR')}
                            </td>
                            <td className="py-3 text-center font-bold text-gray-600">
                              {toPersianDigits(attempt.correctAnswers)} از {toPersianDigits(attempt.totalQuestions)}
                            </td>
                            <td className="py-3 text-center font-bold font-sans text-gray-800">
                              %{toPersianDigits(attempt.score)}
                            </td>
                            <td className="py-3 text-center">
                              <span className="bg-[#eff3ff] text-[#00236f] font-black text-xs px-2.5 py-1 rounded-lg">
                                {attempt.level}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* VIEW 5: ADMIN CONSOLE */}
        {currentPage === 'admin' && user && user.role === 'admin' && (
          <div className="max-w-7xl mx-auto px-6 py-10 w-full flex flex-col gap-8">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1 text-right">
                <span className="bg-[#ffdad6] text-[#93000a] text-[11px] font-bold px-2.5 py-1 rounded-full">دسترس مدیریت سیستم</span>
                <h2 className="text-2xl font-bold text-[#00236f] mt-1">پنل مدیریت یکپارچه سامانه تعیین سطح</h2>
              </div>
              <button 
                onClick={() => triggerAddOrEditForm()}
                className="bg-[#00236f] text-white hover:bg-[#1e3a8a] text-xs font-bold px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                طراحی و ساخت آزمون جدید
              </button>
            </div>

            {/* Quick Metrics stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-[#c5c5d3]/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block font-semibold">تعداد آزمون‌های فعال</span>
                  <span className="text-2xl font-black text-[#00236f] block mt-1">{toPersianDigits(adminTests.length)} مورد</span>
                </div>
                <div className="w-10 h-10 bg-[#eff3ff] text-[#00236f] rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white border border-[#c5c5d3]/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block font-semibold">آزمون‌های غیرفعال</span>
                  <span className="text-2xl font-black text-amber-600 block mt-1">
                    {toPersianDigits(adminTests.filter(t => !t.isActive).length)} مورد
                  </span>
                </div>
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white border border-[#c5c5d3]/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block font-semibold">تعداد کل کارآموزان</span>
                  <span className="text-2xl font-black text-[#005236] block mt-1">{toPersianDigits(adminUsers.length)} زبان‌آموز</span>
                </div>
                <div className="w-10 h-10 bg-[#6ffbbe]/25 text-[#005236] rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Admin Tabs Layout (1. Users Management / 2. Exams Management) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              
              {/* Tab section 1: Users table (Left) */}
              <div className="xl:col-span-7 bg-white border border-[#c5c5d3]/40 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                  <span className="font-bold text-base text-[#00236f] flex items-center gap-1.5">
                    <Users className="w-5 h-5" />
                    مدیریت کاربران و سطح‌بندی تحصیلی
                  </span>

                  {/* Search box */}
                  <div className="relative w-full sm:w-64">
                    <input 
                      type="text" 
                      placeholder="جستجوی نام یا کاربر..."
                      value={adminSearch}
                      onChange={(e) => {
                        setAdminSearch(e.target.value);
                        setAdminPage(1); // reset page on search
                      }}
                      className="w-full bg-[#f9f9ff] border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#00236f] text-xs"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-100">
                        <th className="py-2.5">اطلاعات زبان‌آموز</th>
                        <th className="py-2.5 text-center">نقش سیستم</th>
                        <th className="py-2.5 text-center">وضعیت تایید</th>
                        <th className="py-2.5 text-center">سطح (CEFR)</th>
                        <th className="py-2.5 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-50">
                      {adminUsers.map(u => (
                        <tr key={u.id}>
                          <td className="py-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-[#121c2a]">{u.fullName}</span>
                              <span className="text-[10px] text-gray-400">نام کاربری: {u.username}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <button 
                              onClick={() => toggleUserRole(u.id, u.role)}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                              {u.role === 'admin' ? 'مدیر سیستم' : 'مخاطب عادی'}
                            </button>
                          </td>
                          <td className="py-3 text-center">
                            <button 
                              onClick={() => toggleUserVerificationStatus(u.id, u.isVerified)}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${u.isVerified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                            >
                              {u.isVerified ? 'تایید شده' : 'عدم تایید'}
                            </button>
                          </td>
                          <td className="py-3 text-center">
                            {/* Manual Override selector */}
                            <select 
                              value={u.level || 'نامشخص'} 
                              onChange={(e) => overrideUserLevelCode(u.id, e.target.value)}
                              className="bg-[#eff3ff] text-[#00236f] text-xs font-black p-1 rounded-md border-0 focus:ring-1 focus:ring-[#00236f]"
                            >
                              <option value="نامشخص">نامشخص</option>
                              <option value="A1">A1</option>
                              <option value="A2">A2</option>
                              <option value="B1">B1</option>
                              <option value="B2">B2</option>
                              <option value="C1">C1</option>
                              <option value="C2">C2</option>
                            </select>
                          </td>
                          <td className="py-3 text-center">
                            <button 
                              onClick={() => deleteUserFromPlatform(u.id)}
                              className="text-[#ba1a1a] hover:bg-[#ffdad6]/20 p-1.5 rounded-lg border border-transparent hover:border-[#ffdad6] transition-colors"
                              title="حذف کامل کاربر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {adminTotalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-4 border-t border-gray-100 mt-2">
                    <button 
                      disabled={adminPage === 1}
                      onClick={() => setAdminPage(prev => Math.max(prev - 1, 1))}
                      className="text-xs font-bold text-gray-500 bg-gray-150 border border-gray-200 px-3 py-1 rounded-lg disabled:opacity-40"
                    >
                      قبلی
                    </button>
                    <span className="text-xs text-gray-400">
                      صفحه {toPersianDigits(adminPage)} از {toPersianDigits(adminTotalPages)}
                    </span>
                    <button 
                      disabled={adminPage === adminTotalPages}
                      onClick={() => setAdminPage(prev => Math.min(prev + 1, adminTotalPages))}
                      className="text-xs font-bold text-gray-500 bg-gray-150 border border-gray-200 px-3 py-1 rounded-lg disabled:opacity-40"
                    >
                      بعدی
                    </button>
                  </div>
                )}

              </div>

              {/* Tab section 2: Exams management (Right) */}
              <div className="xl:col-span-5 bg-white border border-[#c5c5d3]/40 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                
                <span className="font-bold text-base text-[#00236f] flex items-center gap-1.5 pb-4 border-b border-gray-100">
                  <Settings className="w-5 h-5" />
                  مدیریت آزمون‌ها و گزینه‌ها
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-100">
                        <th className="py-2">عنوان آزمون</th>
                        <th className="py-2">تعداد سوالات</th>
                        <th className="py-2">مدت زمان (دقیقه)</th>
                        <th className="py-2">وضعیت انتشار</th>
                        <th className="py-2 text-center">عملیات ویرایشی</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-50">
                      {adminTests.map(test => (
                        <tr key={test._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-1 font-bold text-[#00236f]">{test.title}</td>
                          <td className="py-3.5 px-1 font-semibold">{toPersianDigits(test.questions.length)} سوال</td>
                          <td className="py-3.5 px-1 font-semibold">{toPersianDigits(test.duration)} دقیقه</td>
                          <td className="py-3.5 px-1">
                            <button 
                              onClick={() => toggleTestActivation(test._id)}
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${test.isActive ? 'bg-[#6ffbbe]/20 text-[#005236] border-[#6ffbbe]/30' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${test.isActive ? 'bg-[#27c38a]' : 'bg-gray-400'}`}></div>
                              {test.isActive ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="py-3.5 px-1 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => triggerAddOrEditForm(test)}
                                className="bg-[#eff3ff] hover:bg-[#dce1ff] text-[#0058be] p-1.5 rounded-lg border border-[#c5c5d3]/45 transition-colors"
                                title="ویرایش جزئیات آزمون"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => deleteTestFromPlatform(test._id)}
                                className="bg-red-50 hover:bg-red-100 text-[#ba1a1a] p-1.5 rounded-lg border border-red-100 transition-colors"
                                title="حذف آزمون"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* ==========================================
          ADMIN POPUP: ADD / EDIT TEST DIALOG
          ========================================== */}
      <AnimatePresence>
        {showTestForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-6 my-8 max-h-[90vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-[#00236f]" id="add-test-title">
                  {editingTestId ? 'ویرایش آزمون موجود' : 'تعریف و طراحی آزمون جدید'}
                </h3>
                <button 
                  onClick={() => setShowTestForm(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content Scrolling wrapper */}
              <form onSubmit={saveTestForm} className="flex-grow overflow-y-auto pr-2 space-y-5 py-2 pl-1">
                
                {/* Meta details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <label className="block text-xs font-semibold text-[#444651] mb-1.5">عنوان آزمون</label>
                    <input 
                      type="text"
                      required
                      placeholder="مانند: آزمون گرامر زمان‌های گذشته"
                      value={testFormTitle}
                      onChange={(e) => setTestFormTitle(e.target.value)}
                      className="w-full bg-[#f9f9ff] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#00236f] text-sm text-right"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-[#444651] mb-1.5">مدت زمان (دقیقه)</label>
                    <input 
                      type="number"
                      required
                      min={1}
                      value={testFormDuration}
                      onChange={(e) => setTestFormDuration(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#f9f9ff] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#00236f] text-sm text-right font-bold"
                    />
                  </div>
                  <div className="md:col-span-12">
                    <label className="block text-xs font-semibold text-[#444651] mb-1.5">توضیحات معرفی آزمون</label>
                    <textarea 
                      placeholder="توضیحات لازم پیرامون مواد مهارتی آین آزمون..."
                      value={testFormDescription}
                      onChange={(e) => setTestFormDescription(e.target.value)}
                      className="w-full bg-[#f9f9ff] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#00236f] text-sm text-right h-16 resize-none"
                    />
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Question builder catalog */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-[#00236f] block">طراحی بانک سوالات آزمون</span>
                    <button 
                      type="button"
                      onClick={addFormQuestionRow}
                      className="flex items-center gap-1 bg-[#6ffbbe]/15 text-[#005236] border border-[#6ffbbe]/30 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#6ffbbe]/30"
                    >
                      <Plus className="w-4 h-4" />
                      افزودن پاسخ تستی جدید
                    </button>
                  </div>

                  {testFormQuestions.map((question, qIdx) => (
                    <div key={qIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4 relative">
                      <button 
                        type="button"
                        onClick={() => removeFormQuestionRow(qIdx)}
                        className="absolute top-3 left-3 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 p-1 rounded-md"
                        title="پاک کردن این سوال"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="pr-4">
                        <span className="font-bold text-xs text-[#00236f] block mb-1">سوال شماره {toPersianDigits(qIdx + 1)}:</span>
                        <input 
                          type="text"
                          required
                          placeholder="متن انگلیسی سوال مانند : I _____ a student."
                          value={question.questionText}
                          onChange={(e) => updateQuestionTextVal(qIdx, e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#00236f] text-sm text-left font-mono"
                          dir="ltr"
                        />
                      </div>

                      {/* Options matrix list */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-gray-500 font-semibold">گزینه‌های پاسخ (انتخاب دکمه رادیویی تعیین‌کننده گزینه صحیح است):</span>
                          <button 
                            type="button"
                            onClick={() => addOptionToFormQuestion(qIdx)}
                            className="text-[11px] text-[#0058be] font-bold hover:underline"
                          >
                            + افزودن گزینه دیگر برای سوال {toPersianDigits(qIdx + 1)}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {question.options.map((option, oIdx) => {
                            const isCorrect = question.correctAnswerIndex === oIdx;
                            return (
                              <div key={oIdx} className="flex items-center gap-2 border border-gray-200 bg-white p-2 rounded-lg">
                                <input 
                                  type="radio"
                                  name={`correct-answer-input-${qIdx}`}
                                  checked={isCorrect}
                                  onChange={() => handleSelectCorrectIndex(qIdx, oIdx)}
                                  className="w-4 h-4 text-[#00236f] focus:ring-[#00236f] accent-primary"
                                />
                                <input 
                                  type="text"
                                  required
                                  placeholder={`گزینه ${String.fromCharCode(65 + oIdx)}`}
                                  value={option}
                                  onChange={(e) => updateQuestionOptionVal(qIdx, oIdx, e.target.value)}
                                  className="flex-grow font-mono text-xs focus:outline-none text-left p-1 border-b border-transparent focus:border-gray-200"
                                  dir="ltr"
                                />
                                <button 
                                  type="button"
                                  onClick={() => removeOptionFromFormQuestion(qIdx, oIdx)}
                                  className="text-gray-300 hover:text-red-500 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowTestForm(false)}
                    className="border border-gray-300 text-gray-500 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50"
                  >
                    انصراف
                  </button>
                  <button 
                    type="submit"
                    className="bg-[#00236f] text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-[#1e3a8a] shadow-md"
                  >
                    ثبت و ذخیره تغییرات آزمون
                  </button>
                </div>
                
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          PERSISTENT AESTHETIC FOOTER
          ========================================== */}
      <footer className="bg-[#dee9fd] border-t border-[#c5c5d3]/30 mt-auto py-10 z-10">
        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
          <div>
            <h4 className="font-headline-sm text-lg font-bold text-[#00236f] mb-3">English Pro</h4>
            <p className="text-sm text-[#444651] max-w-sm leading-relaxed">
              سایت تخصصی و دانشجویی آزمون تعیین سطح زبان انگلیسی. با بهره‌گیری از سوالات طبقه‌بندی شده CEFR.
            </p>
            <p className="text-xs text-gray-400 mt-4 leading-none" dir="ltr">
              &copy; 1403/2026 English Placement Pro. Built for Academic Evaluations.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-sm text-[#00236f] mb-3">لینک‌های سریع</h5>
            <ul className="space-y-2 text-sm text-[#444651]">
              <li>
                <button onClick={() => setCurrentPage('home')} className="hover:underline transition-all">صفحه اصلی</button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    if (token) {
                      setCurrentPage(user?.role === 'admin' ? 'admin' : 'dashboard');
                    } else {
                      setAuthMode('login');
                      setCurrentPage('login');
                    }
                  }} 
                  className="hover:underline transition-all"
                >
                  کنترل پنل کاربری من
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-sm text-[#00236f] mb-3">پشتیبانی سیستم</h5>
            <p className="text-xs text-gray-500 mb-2">در صورت بروز مشکل در فرآیند آزمون یا ذخیره‌سازی نمرات:</p>
            <span className="text-xs text-[#0058be] font-bold block" dir="ltr">support@englishpro.edu</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
