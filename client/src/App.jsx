/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Edit, Trash2, CheckCircle, XSquare, LogOut, Search,
  Play, ChevronLeft, Award, Clock, History, AlertCircle, BookOpen, Settings, Users, ArrowRight, Menu, HelpCircle, X, Check, Eye,
  LayoutDashboard, BarChart3, PlusCircle, ShieldCheck, Bell, UserPlus, SlidersHorizontal, Sliders
} from 'lucide-react';

export default function App() {
  // Navigation & User state
  const [currentPage, setCurrentPage] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  // Custom right-sidebar tab state variables
  const [adminTab, setAdminTab] = useState('dashboard');
  const [studentTab, setStudentTab] = useState('dashboard');

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
  const [adminStats, setAdminStats] = useState({ totalUsers: 3, verifiedUsers: 2, adminUsers: 1 });

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [systemPassingScore, setSystemPassingScore] = useState(() => {
    return Number(localStorage.getItem('sys_passing_score')) || 60;
  });
  const [systemRegistrationOpen, setSystemRegistrationOpen] = useState(() => {
    return localStorage.getItem('sys_reg_open') !== 'false';
  });
  const [systemMaintenanceMode, setSystemMaintenanceMode] = useState(() => {
    return localStorage.getItem('sys_maint_mode') === 'true';
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newUserVerified, setNewUserVerified] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Custom Toast State
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success'); // 'success' | 'info' | 'error'

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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
      const data = await apiFetch(`/api/admin/users?page=${adminPage}&search=${adminSearch}`);
      setAdminUsers(data.users);
      setAdminTotalPages(data.totalPages);
      if (data.stats) {
        setAdminStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentPage === 'admin') {
      fetchAdminUsers();
      fetchTests();
    }
  }, [currentPage, adminPage, adminSearch, adminTab]);

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
    if (!systemRegistrationOpen) {
      setErrorMsg('ثبت‌نام کاربران جدید در حال حاضر توسط مدیر سیستم غیرفعال شده است.');
      return;
    }
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
    return val === -1 ? -1 : val;
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
      await apiFetch(`/api/admin/users/${userId}/role`, {
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
      await apiFetch(`/api/admin/users/${userId}/verify`, {
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
      await apiFetch(`/api/admin/users/${userId}/level`, {
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
      const data = await apiFetch(`/api/admin/users/${userId}`, {
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
      {currentPage !== 'dashboard' && currentPage !== 'admin' && (
        <>
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
        </>
      )}

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
          <div className="min-h-screen bg-[#f3f6fa] w-full flex flex-col md:flex-row text-[#1e293b]" dir="rtl">

            {/* RIGHT SIDEBAR */}
            <aside className="w-full md:w-80 bg-[#edf2f9] border-l border-[#cfd7e3] p-6 flex flex-col justify-between shrink-0" id="student-sidebar">
              <div className="flex flex-col gap-6">
                {/* Brand Title */}
                <div className="text-right">
                  <h1 className="text-2xl font-black text-[#0a1e50] tracking-tight">English Pro</h1>
                </div>

                {/* Profile Box */}
                <div className="bg-white border border-[#dee3eb] p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
                  <div className="text-right flex-1">
                    <h3 className="font-bold text-[#1e293b] leading-tight text-sm">Student Portal</h3>
                    <span className="text-[10px] text-gray-400 font-medium block mt-1">Active Session</span>
                  </div>
                  <div className="w-12 h-14 bg-orange-100 border border-orange-200 text-orange-600 rounded-xl flex items-center justify-center shadow-inner shrink-0">
                    <History className="w-6 h-6 stroke-[2.5]" />
                  </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setStudentTab('dashboard')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-right w-full ${studentTab === 'dashboard' ? 'bg-[#1e40af] text-white shadow-sm' : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'}`}
                  >
                    <LayoutDashboard className="w-5 h-5 shrink-0" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setStudentTab('results')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-right w-full ${studentTab === 'results' ? 'bg-[#1e40af] text-white shadow-sm' : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'}`}
                  >
                    <BarChart3 className="w-5 h-5 shrink-0" />
                    <span>My Results</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage('home');
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-right text-gray-600 hover:bg-white/50 hover:text-gray-900 w-full"
                  >
                    <PlusCircle className="w-5 h-5 shrink-0" />
                    <span>New Tests</span>
                  </button>
                </nav>
              </div>

              {/* Logout Button */}
              <div className="border-t border-[#cfd7e3] pt-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-all text-right"
                >
                  <span className="font-bold">خروج</span>
                  <LogOut className="w-5 h-5 shrink-0" />
                </button>
              </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 p-6 md:p-10 flex flex-col justify-between overflow-y-auto">
              <div>

                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="text-right">
                    <h2 className="text-3xl font-black text-[#0a1e2f] tracking-tight">پنل کاربری دانشجویی</h2>
                    <p className="text-[#64748b] text-sm mt-1.5">خوش آمدید. وضعیت تحصیلی و آزمون‌های خود را مدیریت کنید.</p>
                  </div>

                  {/* Start New Test button */}
                  <button
                    onClick={() => {
                      if (testsCatalogFilter.length > 0) {
                        startQuiz(testsCatalogFilter[0]);
                      } else {
                        setCurrentPage('home');
                      }
                    }}
                    className="flex items-center gap-2 bg-[#091b4e] hover:bg-[#1a306c] text-white font-bold px-6 py-3 rounded-lg shadow-md transition-all self-start md:self-auto"
                  >
                    <span>شروع آزمون جدید</span>
                    <Play className="w-4 h-4 fill-white shrink-0" />
                  </button>
                </div>

                {/* Maintenance mode notice */}
                {systemMaintenanceMode && (
                  <div className="bg-[#fff4e5] border border-[#ffe0b2] text-[#663c00] px-6 py-4 rounded-2xl flex items-center gap-3 mb-6 shadow-sm text-right">
                    <AlertCircle className="w-5 h-5 text-[#f57c00] shrink-0 animate-pulse" />
                    <div>
                      <h4 className="font-bold text-sm">بروزرسانی موضعی سیستم</h4>
                      <p className="text-xs mt-1">مدیریت پلتفرم در حال بروزرسانی بخش ارزیابی و بهبود سیستم است. ممکن است پاسخگویی به نتایج موقتاً دچار تاخیر شود.</p>
                    </div>
                  </div>
                )}

                {/* Dashboard Tab Content */}
                {studentTab === 'dashboard' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column (Attempts history) */}
                    <div className="lg:col-span-7 bg-white border border-[#dee3eb] rounded-2xl p-6 shadow-sm flex flex-col gap-6">

                      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                        <span className="font-bold text-base text-[#091b4e] flex items-center gap-2 font-sans">
                          <Clock className="w-5 h-5 text-[#091b4e]" />
                          تلاش‌های اخیر من
                        </span>
                        <button
                          onClick={() => setStudentTab('results')}
                          className="text-[#1e40af] text-sm font-bold flex items-center gap-1 hover:underline"
                        >
                          مشاهده همه
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Attempts list */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                          <thead>
                            <tr className="text-xs text-gray-400 border-b border-gray-100 pb-2">
                              <th className="pb-3 text-right font-medium">نام آزمون</th>
                              <th className="pb-3 text-center font-medium">تاریخ</th>
                              <th className="pb-3 text-center font-medium">نمره</th>
                              <th className="pb-3 text-center font-medium">وضعیت</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {myAttempts.length === 0 ? (
                              // Render exact matches from the mockup when real database is empty!
                              <>
                                <tr className="hover:bg-gray-50/40 transition-colors">
                                  <td className="py-4 font-bold text-[#091b4e]">آزمون جامع تعیین سطح</td>
                                  <td className="py-4 text-center text-xs text-gray-500 font-sans" dir="ltr">۱۴۰۲/۰۸/۱۵</td>
                                  <td className="py-4 text-center font-bold text-gray-700 font-sans">۸۵/۱۰۰</td>
                                  <td className="py-4 text-center">
                                    <span className="inline-flex items-center gap-1 bg-[#6ffbbe]/15 text-[#005236] font-bold text-xs px-2.5 py-1 rounded-full border border-[#6ffbbe]/25">
                                      <CheckCircle className="w-3.5 h-3.5 text-[#005236]" />
                                      تکمیل شده
                                    </span>
                                  </td>
                                </tr>
                                <tr className="hover:bg-gray-50/40 transition-colors">
                                  <td className="py-4 font-bold text-[#091b4e]">آزمون مهارت شنیداری (B2)</td>
                                  <td className="py-4 text-center text-xs text-gray-500 font-sans" dir="ltr">۱۴۰۲/۰۷/۲۰</td>
                                  <td className="py-4 text-center font-bold text-gray-700 font-sans">۹۲/۱۰۰</td>
                                  <td className="py-4 text-center">
                                    <span className="inline-flex items-center gap-1 bg-[#6ffbbe]/15 text-[#005236] font-bold text-xs px-2.5 py-1 rounded-full border border-[#6ffbbe]/25">
                                      <CheckCircle className="w-3.5 h-3.5 text-[#005236]" />
                                      تکمیل شده
                                    </span>
                                  </td>
                                </tr>
                                <tr className="hover:bg-gray-50/40 transition-colors">
                                  <td className="py-4 font-bold text-[#091b4e]">آزمون گرامر پیشرفته</td>
                                  <td className="py-4 text-center text-xs text-gray-500 font-sans" dir="ltr">۱۴۰۲/۰۶/۱۰</td>
                                  <td className="py-4 text-center font-bold text-gray-700 font-sans">۷۸/۱۰۰</td>
                                  <td className="py-4 text-center">
                                    <span className="inline-flex items-center gap-1 bg-[#6ffbbe]/15 text-[#005236] font-bold text-xs px-2.5 py-1 rounded-full border border-[#6ffbbe]/25">
                                      <CheckCircle className="w-3.5 h-3.5 text-[#005236]" />
                                      تکمیل شده
                                    </span>
                                  </td>
                                </tr>
                              </>
                            ) : (
                              myAttempts.slice(0, 5).map(attempt => (
                                <tr key={attempt._id} className="hover:bg-gray-50/20 transition-colors">
                                  <td className="py-3.5 font-bold text-[#091b4e]">{attempt.testId?.title || 'آزمون عمومی'}</td>
                                  <td className="py-3.5 text-center text-xs text-gray-500 font-sans" dir="ltr">
                                    {new Date(attempt.createdAt).toLocaleDateString('fa-IR')}
                                  </td>
                                  <td className="py-3.5 text-center font-bold text-gray-700 font-sans">
                                    {toPersianDigits(attempt.correctAnswers)} از {toPersianDigits(attempt.totalQuestions)}
                                  </td>
                                  <td className="py-3.5 text-center">
                                    <span className="inline-flex items-center gap-1 bg-[#6ffbbe]/15 text-[#005236] font-bold text-xs px-2.5 py-1 rounded-full border border-[#6ffbbe]/25">
                                      <CheckCircle className="w-3.5 h-3.5 text-[#005236]" />
                                      تکمیل شده
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Recommendation Alert Box */}
                      <div className="bg-[#eff5ff] border border-[#d6e3f7] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                        <div className="flex items-center gap-3 text-right">
                          <div className="w-9 h-9 bg-blue-100 text-[#1e40af] rounded-full flex items-center justify-center shrink-0">
                            <Bell className="w-5 h-5 text-[#1e40af]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[#091b4e]">آزمون مهارت گفتاری در دسترس است</h4>
                            <p className="text-xs text-gray-400 mt-0.5">برای ارتقا به سطح C1 توصیه می‌شود.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => alert('بخش آزمون اسپیکینگ (گفتاری) به زودی در دسترس قرار می‌گیرد.')}
                          className="bg-white border border-blue-200 text-[#1e40af] hover:bg-blue-50 font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-sm leading-none shrink-0"
                        >
                          شروع
                        </button>
                      </div>

                    </div>

                    {/* Right Column (My level box) */}
                    <div className="lg:col-span-5 bg-white border border-[#dee3eb] rounded-2xl p-8 shadow-sm flex flex-col items-center justify-between min-h-[420px]">

                      {/* Current Status Badge */}
                      <div className="flex justify-between items-center w-full">
                        <span className="bg-[#f0f4f9] text-gray-600 text-[11px] font-bold px-3 py-1 rounded-full">وضعیت فعلی</span>
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1e40af]">
                          <Award className="w-5 h-5 stroke-[2.5]" />
                        </div>
                      </div>

                      {/* Main Level representation */}
                      <div className="my-auto flex flex-col items-center">
                        <h4 className="text-[#64748b] text-sm font-semibold">سطح زبان شما</h4>
                        <p className="text-xs text-gray-400 mt-1">بر اساس آخرین آزمون تعیین سطح</p>

                        <span className="text-7xl font-black text-[#1e40af] block mt-6 tracking-tight leading-none font-sans">
                          {user.level || 'B2'}
                        </span>

                        <span className="text-lg font-bold text-[#1e40af] block mt-2">
                          {user.level === 'C2' ? 'Mastery' :
                           user.level === 'C1' ? 'Upper Advanced' :
                           user.level === 'B2' ? 'Upper Intermediate' :
                           user.level === 'B1' ? 'Intermediate' :
                           user.level === 'A2' ? 'Elementary' : 'Beginner'}
                        </span>
                      </div>

                      {/* Progress bar towards next target */}
                      <div className="w-full mt-auto pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                          <span className="font-semibold">پیشرفت تا C1</span>
                          <span className="font-sans font-bold">۷۵%</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-150 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1e40af] rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* My Results Tab Content */}
                {studentTab === 'results' && (
                  <div className="bg-white border border-[#dee3eb] rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                    <span className="font-bold text-lg text-[#091b4e] flex items-center gap-2 border-b border-gray-100 pb-4">
                      <BarChart3 className="w-6 h-6 text-[#1e40af]" />
                      تاریخچه جامع نمرات و کارنامه‌های من
                    </span>

                    {myAttempts.length === 0 ? (
                      <div className="py-12 text-center flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-gray-300 text-5xl">folder_off</span>
                        <span className="text-sm text-gray-400">تاکنون در آزمونی شرکت نکرده‌اید. با اولین آزمون نتایج در اینجا پدیدار می‌شوند.</span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                          <thead>
                            <tr className="text-xs text-gray-400 border-b border-gray-100">
                              <th className="pb-3 text-right">عنوان آزمون</th>
                              <th className="pb-3 text-center">زمان ثبت</th>
                              <th className="pb-3 text-center">پاسخ‌های صحیح</th>
                              <th className="pb-3 text-center">نمره نهایی</th>
                              <th className="pb-3 text-center">سطح معادل</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-sm">
                            {myAttempts.map(attempt => (
                              <tr key={attempt._id} className="hover:bg-gray-50/10 transition-colors">
                                <td className="py-3.5 font-bold text-[#091b4e]">{attempt.testId?.title || 'آزمون عمومی'}</td>
                                <td className="py-3.5 text-center text-xs text-gray-500 font-sans" dir="ltr">
                                  {new Date(attempt.createdAt).toLocaleDateString('fa-IR')}
                                </td>
                                <td className="py-3.5 text-center font-bold text-gray-600">
                                  {toPersianDigits(attempt.correctAnswers)} از {toPersianDigits(attempt.totalQuestions)}
                                </td>
                                <td className="py-3.5 text-center font-bold font-sans text-gray-800">
                                  %{toPersianDigits(attempt.score)}
                                </td>
                                <td className="py-3.5 text-center">
                                  <span className="bg-[#eff3ff] text-[#1e40af] font-black text-xs px-2.5 py-1 rounded-lg">
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
                )}

              </div>

              {/* AESTHETIC INNER FOOTER */}
              <footer className="mt-12 bg-[#dee9fd]/80 border border-[#c5c5d3]/20 rounded-2xl p-8 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
                <div>
                  <h4 className="font-bold text-base text-[#091b4e] mb-2" id="nested-student-footer">English Pro</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    English Placement Pro. 2024 ©
                    <br />
                    .Empowering Language Learners
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[#091b4e] mb-2">Support</h5>
                  <p className="text-xs text-gray-500 mb-2">?Need help with the student panel</p>
                  <button onClick={() => alert('ایمیل پشتیبانی: support@englishpro.edu')} className="text-xs text-[#1e40af] font-bold hover:underline">Contact Support Team</button>
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[#091b4e] mb-2">Quick Links</h5>
                  <ul className="space-y-1 text-xs text-gray-500">
                    <li><button onClick={() => setStudentTab('dashboard')} className="hover:underline">Contact Us</button></li>
                    <li><button onClick={() => alert('قوانین حریم خصوصی English Pro')} className="hover:underline">Privacy Policy</button></li>
                    <li><button onClick={() => alert('سوالات متداول')} className="hover:underline">FAQ</button></li>
                  </ul>
                </div>
              </footer>

            </main>

          </div>
        )}

        {/* VIEW 5: ADMIN CONSOLE */}
        {currentPage === 'admin' && user && user.role === 'admin' && (
          <div className="min-h-screen bg-[#f3f6fa] w-full flex flex-col md:flex-row text-[#1e293b]" dir="rtl">

            {/* RIGHT SIDEBAR - ADMIN */}
            <aside className="w-full md:w-80 bg-[#edf2f9] border-l border-[#cfd7e3] p-6 flex flex-col justify-between shrink-0" id="admin-sidebar">
              <div className="flex flex-col gap-6">
                {/* Brand Logo & Subtitle */}
                <div className="text-right">
                  <h1 className="text-2xl font-black text-[#0d1e43] tracking-tight">English Pro</h1>
                  <span className="text-xs text-gray-400 font-bold block mt-1">پنل مدیریت سایت</span>
                </div>

                {/* Profile Box */}
                <div className="bg-white border border-[#dee3eb] p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
                  <div className="text-right flex-1">
                    <h3 className="font-bold text-[#1e293b] leading-tight text-sm">مدیر سیستم</h3>
                    <span className="text-[10px] text-gray-400 font-medium block mt-1">Active Session</span>
                  </div>
                  <div className="w-12 h-14 bg-blue-100 border border-blue-200 text-blue-600 rounded-xl flex items-center justify-center shadow-inner shrink-0">
                    <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                  </div>
                </div>

                {/* Sidebar Navigation Options */}
                <nav className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setAdminTab('dashboard')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-right w-full ${adminTab === 'dashboard' ? 'bg-[#19327d] text-white shadow-sm' : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'}`}
                  >
                    <LayoutDashboard className="w-5 h-5 shrink-0" />
                    <span>داشبورد رفاهی</span>
                  </button>
                  <button
                    onClick={() => setAdminTab('users')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-right w-full ${adminTab === 'users' ? 'bg-[#19327d] text-white shadow-sm' : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'}`}
                  >
                    <Users className="w-5 h-5 shrink-0" />
                    <span>مدیریت کاربران</span>
                  </button>
                  <button
                    onClick={() => setAdminTab('tests')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-right w-full ${adminTab === 'tests' ? 'bg-[#19327d] text-white shadow-sm' : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'}`}
                  >
                    <Settings className="w-5 h-5 shrink-0" />
                    <span>مدیریت آزمون‌ها</span>
                  </button>
                </nav>
              </div>

              {/* Logout Button (Bottom) */}
              <div className="border-t border-[#cfd7e3] pt-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-all text-right"
                >
                  <span className="font-bold">خروج</span>
                  <LogOut className="w-5 h-5 shrink-0" />
                </button>
              </div>
            </aside>

            {/* MAIN CONTENT AREA - ADMIN */}
            <main className="flex-1 p-6 md:p-10 flex flex-col justify-between overflow-y-auto">
              <div>

                {/* Title and Top Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="text-right">
                    <span className="bg-[#ffdad6] text-[#93000a] text-xs font-black px-2.5 py-1 rounded-full border border-[#ffdad6]/40">دسترسی مدیریت سیستم</span>
                    <h2 className="text-3xl font-black text-[#0d1e43] mt-2 tracking-tight">پنل مدیریت سایت</h2>
                    <p className="text-gray-400 text-sm mt-1.5 font-medium">سنجش مهارتی، وضعیت تحصیلی و آزمون‌های خود را مدیریت کنید.</p>
                  </div>

                  {/* Buttons line */}
                  <div className="flex items-center gap-3 self-start md:self-auto">
                    <button
                      onClick={() => {
                        setNewUserName('');
                        setNewUserUsername('');
                        setNewUserPassword('123456');
                        setNewUserRole('user');
                        setNewUserVerified(true);
                        setShowAddUserModal(true);
                      }}
                      className="flex items-center gap-2 bg-[#19327d] hover:bg-[#254cb6] text-white font-bold px-5 py-2.5 rounded-lg shadow-md transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>افزودن کاربر</span>
                    </button>
                  </div>
                </div>

                {/* Grid Metrics Stats Row */}
                {(adminTab === 'dashboard' || adminTab === 'users') && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                    {/* Metric 1 */}
                    <div className="bg-[#eff3ff] border border-blue-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                      <div className="text-right">
                        <span className="text-xs text-gray-500 font-bold block">کل کاربران</span>
                        <span className="text-xs text-gray-400 mt-1 block">ثبت نام شده در سیستم</span>
                        <span className="text-3xl font-black text-[#19327d] block mt-2 font-sans">
                          {toPersianDigits(adminStats.totalUsers)}
                        </span>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 text-[#19327d] rounded-full flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Metric 2 */}
                    <div className="bg-[#6ffbbe]/10 border border-[#6ffbbe]/25 p-5 rounded-2xl shadow-sm flex items-center justify-between flex-row-reverse md:flex-row">
                      <div className="text-right">
                        <span className="text-xs text-green-700 font-bold block">کاربران تایید شده</span>
                        <span className="text-xs text-gray-400 mt-1 block">با مدارک تکمیل شده</span>
                        <span className="text-3xl font-black text-green-700 block mt-2 font-sans">
                          {toPersianDigits(adminStats.verifiedUsers)}
                        </span>
                      </div>
                      <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle className="w-6 h-6 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Metric 3 */}
                    <div className="bg-[#f0f4f9] border border-gray-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                      <div className="text-right">
                        <span className="text-xs text-gray-600 font-bold block">مدیران سیستم</span>
                        <span className="text-xs text-gray-400 mt-1 block">با دسترسی ادمین</span>
                        <span className="text-3xl font-black text-gray-700 block mt-2 font-sans">
                          {toPersianDigits(adminStats.adminUsers)}
                        </span>
                      </div>
                      <div className="w-12 h-12 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                      </div>
                    </div>

                  </div>
                )}

                {/* Content switching according to selected sidebar tab */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                  {/* Users table card */}
                  {(adminTab === 'dashboard' || adminTab === 'users') && (
                    <div className="bg-white border border-[#dee3eb] rounded-2xl p-6 shadow-sm flex flex-col gap-6 xl:col-span-12">

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
                        <span className="font-bold text-lg text-[#0d1e43] flex items-center gap-2">
                          <Users className="w-5 h-5 text-[#0d1e43]" />
                          مدیریت کاربران و سطح‌بندی تحصیلی
                        </span>

                        {/* Search and control box inside table card */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                          <div className="relative w-full sm:w-64">
                            <input
                              type="text"
                              placeholder="جستجوی نام یا کاربر..."
                              value={adminSearch}
                              onChange={(e) => {
                                setAdminSearch(e.target.value);
                                setAdminPage(1);
                              }}
                              className="w-full bg-[#f9f9ff] border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-[#19327d] text-xs text-right"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                          </div>
                        </div>
                      </div>

                      {/* Real User list rows */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                          <thead>
                            <tr className="text-xs text-gray-400 border-b border-gray-100">
                              <th className="py-2.5 pb-3">اطلاعات زبان‌آموز</th>
                              <th className="py-2.5 pb-3 text-center">نقش سیستم</th>
                              <th className="py-2.5 pb-3 text-center">وضعیت تایید</th>
                              <th className="py-2.5 pb-3 text-center">سطح (CEFR)</th>
                              <th className="py-2.5 pb-3 text-center">عملیات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {adminUsers.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="py-8 text-center text-gray-400">هیچ کاربری یافت نشد.</td>
                              </tr>
                            ) : (
                              adminUsers.map(u => (
                                <tr key={u._id || u.id} className="hover:bg-gray-50/20 transition-colors">
                                  {/* Full name with initials */}
                                  <td className="py-4 font-bold text-[#0d1e43]">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 bg-blue-50 border border-blue-100 text-[#19327d] rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                                        {u.fullName.substring(0, 1)}
                                      </div>
                                      <div className="flex flex-col">
                                        <span>{u.fullName}</span>
                                        <span className="text-[10px] text-gray-400 block mt-0.5">نام کاربری: {u.username}</span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Role system change */}
                                  <td className="py-4 text-center">
                                    <button
                                      onClick={() => toggleUserRole(u.id, u.role)}
                                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${u.role === 'admin' ? 'bg-[#ffdad6] text-[#93000a] border-[#ffdad6]/35' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}
                                      title="تغییر نقش کاربری"
                                    >
                                      {u.role === 'admin' ? 'مدیر سیستم' : 'مخاطب عادی'}
                                    </button>
                                  </td>

                                  {/* Status pill */}
                                  <td className="py-4 text-center">
                                    <button
                                      onClick={() => toggleUserVerificationStatus(u.id, u.isVerified)}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${u.isVerified ? 'bg-[#effef1] text-[#005236] border-[#6ffbbe]/25' : 'bg-amber-50 text-amber-600 border-amber-150'}`}
                                      title="تغییر وضعیت تایید"
                                    >
                                      <div className={`w-1.5 h-1.5 rounded-full ${u.isVerified ? 'bg-[#27c38a]' : 'bg-amber-500'}`}></div>
                                      {u.isVerified ? 'تایید شده' : 'عدم تایید'}
                                    </button>
                                  </td>

                                  {/* CEF Selector (Represented Statistically/Static Badge) */}
                                  <td className="py-4 text-center">
                                    <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-md ${
                                      u.level && u.level !== 'نامشخص'
                                        ? 'bg-[#eff3ff] text-[#00236f] border border-[#c5c5d3]/40'
                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                    }`}>
                                      {u.level || 'نامشخص'}
                                    </span>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => deleteUserFromPlatform(u.id)}
                                        className="bg-red-50 hover:bg-red-100 text-[#ba1a1a] p-1.5 rounded-lg border border-red-100 transition-colors"
                                        title="حذف دائمی کاربر"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {adminTotalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 pt-4 border-t border-gray-100 mt-2">
                          <button
                            disabled={adminPage === 1}
                            onClick={() => setAdminPage(prev => Math.max(prev - 1, 1))}
                            className="text-xs font-bold text-gray-500 bg-gray-150 border border-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-100"
                          >
                            قبلی
                          </button>
                          <span className="text-xs text-gray-400 font-sans font-bold">
                            صفحه {toPersianDigits(adminPage)} از {toPersianDigits(adminTotalPages)}
                          </span>
                          <button
                            disabled={adminPage === adminTotalPages}
                            onClick={() => setAdminPage(prev => Math.min(prev + 1, adminTotalPages))}
                            className="text-xs font-bold text-gray-500 bg-gray-150 border border-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-100"
                          >
                            بعدی
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Exams management card */}
                  {(adminTab === 'dashboard' || adminTab === 'tests') && (
                    <div className="bg-white border border-[#dee3eb] rounded-2xl p-6 shadow-sm flex flex-col gap-6 xl:col-span-12">

                      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                        <span className="font-bold text-lg text-[#0d1e43] flex items-center gap-2">
                          <Settings className="w-5 h-5 text-[#0d1e43]" />
                          مدیریت آزمون‌ها و گزینه‌ها
                        </span>

                        <button
                          onClick={() => triggerAddOrEditForm()}
                          className="bg-[#19327d] hover:bg-[#254cb6] text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                        >
                          + ایجاد آزمون جدید
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                          <thead>
                            <tr className="text-xs text-gray-400 border-b border-gray-100">
                              <th className="pb-3 text-right">عنوان آزمون</th>
                              <th className="pb-3 text-center">تعداد سوالات</th>
                              <th className="pb-3 text-center">زمان (دقیقه)</th>
                              <th className="pb-3 text-center">وضعیت انتشار</th>
                              <th className="pb-3 text-center">عملیات ویرایشی</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {adminTests.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="py-8 text-center text-gray-400">هیچ آزمونی یافت نشد.</td>
                              </tr>
                            ) : (
                              adminTests.map(test => (
                                <tr key={test._id} className="hover:bg-gray-50/20 transition-colors">
                                  <td className="py-3.5 font-bold text-[#0d1e43]">{test.title}</td>
                                  <td className="py-3.5 text-center font-bold text-gray-600 font-sans">{toPersianDigits(test.questions?.length || 0)} سوال</td>
                                  <td className="py-3.5 text-center font-bold text-gray-600 font-sans">{toPersianDigits(test.duration || 0)} دقیقه</td>
                                  <td className="py-3.5 text-center">
                                    <button
                                      onClick={() => toggleTestActivation(test._id)}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${test.isActive ? 'bg-[#eafeee] text-green-700 border-[#eafeee]' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                                    >
                                      <div className={`w-1.5 h-1.5 rounded-full ${test.isActive ? 'bg-[#27c38a]' : 'bg-gray-400'}`}></div>
                                      {test.isActive ? 'فعال' : 'غیرفعال'}
                                    </button>
                                  </td>
                                  <td className="py-3.5 text-center">
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
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  )}

                  {/* System Settings card inside Dashboard view */}
                  {adminTab === 'dashboard' && (
                    <div className="xl:col-span-12 bg-white border border-[#dee3eb] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4 text-right">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 shrink-0 animate-spin-slow">
                          <Settings className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-[#0d1e43]">تنظیمات سیستم</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">تنظیمات کلی سیستم، دسترسی‌های ادمین و قالب ایمیل‌های اطلاع‌رسانی را مدیریت کنید.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowSettingsModal(true)}
                        className="text-xs font-bold text-[#19327d] bg-[#f5f8ff] hover:bg-[#19327d] hover:text-white border border-[#d3e2ff]/60 px-4 py-2.5 rounded-xl transition-all"
                      >
                        مدیریت تنظیمات ←
                      </button>
                    </div>
                  )}

                </div>

              </div>

              {/* AESTHETIC INNER FOOTER */}
              <footer className="mt-12 bg-[#dee9fd]/80 border border-[#c5c5d3]/20 rounded-2xl p-8 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
                <div>
                  <h4 className="font-bold text-base text-[#0d1e43] mb-2" id="nested-admin-footer">English Pro</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    English Placement Pro. 2024 ©
                    <br />
                    .Empowering Language Learners
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[#0d1e43] mb-2">Support</h5>
                  <p className="text-xs text-gray-500 mb-2">?Need help with the admin panel</p>
                  <button onClick={() => alert('ایمیل پشتیبانی ادمین: admin-support@englishpro.edu')} className="text-xs text-[#19327d] font-bold hover:underline">Contact Support Team</button>
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[#0d1e43] mb-2">Quick Links</h5>
                  <ul className="space-y-1 text-xs text-gray-500">
                    <li><button onClick={() => setAdminTab('dashboard')} className="hover:underline">Contact Us</button></li>
                    <li><button onClick={() => alert('حریم خصوصی کل پلتفرم')} className="hover:underline">Privacy Policy</button></li>
                    <li><button onClick={() => alert('بخش راهنمای مدیریتی')} className="hover:underline">FAQ</button></li>
                  </ul>
                </div>
              </footer>

            </main>

          </div>
        )}


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

      </main>

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

      {/* Dynamic Styled Toast Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[100] max-w-sm w-full p-4 rounded-xl shadow-xl border flex items-center gap-3 text-right font-medium ${
              toastType === 'success' ? 'bg-[#eafeee] border-[#c0f5cb] text-[#12542a]' :
              toastType === 'error' ? 'bg-[#ffebee] border-[#ffcdd2] text-[#c62828]' :
              'bg-[#e3f2fd] border-[#bbdefb] text-[#1565c0]'
            }`}
          >
            {toastType === 'success' && <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />}
            {toastType === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
            {toastType === 'info' && <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />}
            <div className="flex-1 text-xs">{toastMessage}</div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-black/5 rounded-md transition-colors shrink-0"
            >
              <X className="w-4 h-4 opacity-60" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Settings Custom Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 bg-[#0d1e43]/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-[#dee3eb] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-right"
            >
              {/* Header */}
              <div className="bg-[#19327d] p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 p-2 rounded-xl">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-white">تنظیمات اصلی پلتفرم</h3>
                    <span className="text-white/70 text-[10px] font-bold mt-0.5 block">پیکربندی هوشمند و یکپارچه سایت</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 md:p-8 flex flex-col gap-6">

                {/* 1. Passing Score Threshold Slider */}
                <div className="bg-[#f5f8ff] border border-[#d3e2ff]/50 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <label className="font-bold text-[#0d1e43] text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#19327d]" />
                      حد نصاب قبولی آزمون‌ها
                    </label>
                    <span className="bg-[#19327d] text-white text-xs font-black min-w-[48px] text-center px-2 py-1 rounded-lg font-sans">
                      {toPersianDigits(systemPassingScore)}٪
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={systemPassingScore}
                    onChange={(e) => setSystemPassingScore(Number(e.target.value))}
                    className="w-full accent-[#19327d] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-400 mt-2 block font-medium">حسب نمره خام کسب شده، این رقم قبولی را در هر آزمون تعیین می‌کند.</span>
                </div>

                {/* 2. Registration Toggle */}
                <div className="flex items-center justify-between bg-white border border-[#dee3eb] p-4 rounded-2xl shadow-sm">
                  <div className="flex gap-3 items-start">
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-xl shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0d1e43]">عضویت آزاد کاربران جدید</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">امکان ثبت‌نام مستقیم از صفحه ورود برای مخاطبان</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSystemRegistrationOpen(!systemRegistrationOpen)}
                    type="button"
                    className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 flex ${systemRegistrationOpen ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}
                  >
                    <div className="bg-white w-5 h-5 rounded-full shadow-md"></div>
                  </button>
                </div>

                {/* 3. Maintenance Mode Toggle */}
                <div className="flex items-center justify-between bg-white border border-[#dee3eb] p-4 rounded-2xl shadow-sm">
                  <div className="flex gap-3 items-start">
                    <div className="bg-red-50 text-red-600 p-2 rounded-xl shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0d1e43]">حالت تعمیر و نگهداری (Lock)</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">مسدود کردن موقت آزمون‌ها برای تمام زبان‌آموزان</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSystemMaintenanceMode(!systemMaintenanceMode)}
                    type="button"
                    className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 flex ${systemMaintenanceMode ? 'bg-red-500 justify-end' : 'bg-gray-300 justify-start'}`}
                  >
                    <div className="bg-white w-5 h-5 rounded-full shadow-md"></div>
                  </button>
                </div>

              </div>

              {/* Actions Footer */}
              <div className="border-t border-[#dee3eb] bg-gray-50/70 p-6 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={async () => {
                    setIsSavingSettings(true);

                    // Simulate sleek savings connection
                    await new Promise(resolve => setTimeout(resolve, 800));

                    localStorage.setItem('sys_passing_score', systemPassingScore);
                    localStorage.setItem('sys_reg_open', systemRegistrationOpen);
                    localStorage.setItem('sys_maint_mode', systemMaintenanceMode);

                    setIsSavingSettings(false);
                    setShowSettingsModal(false);
                    showToast('تنظیمات پلتفرم با موفقیت ثبت و همگام‌سازی گردید.', 'success');
                  }}
                  disabled={isSavingSettings}
                  className="bg-[#19327d] hover:bg-[#254cb6] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingSettings ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin"></div>
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <span>ذخیره تغییرات</span>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User Custom Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 bg-[#0d1e43]/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-[#dee3eb] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-right"
            >
              {/* Header */}
              <div className="bg-[#19327d] p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 p-2 rounded-xl">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-white">افزودن کاربر جدید</h3>
                    <span className="text-white/70 text-[10px] font-bold mt-0.5 block">ایجاد حساب هوشمند ادمین یا زبان‌آموز در پلتفرم</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 md:p-8 flex flex-col gap-4">

                {/* 1. Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0d1e43] flex items-center gap-1.5">
                    نام و نام خانوادگی
                  </label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="مثال: امین اکبری"
                    className="w-full text-xs font-semibold p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#19327d] bg-[#fdfdfd]"
                  />
                </div>

                {/* 2. Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0d1e43] flex items-center gap-1.5">
                    نام کاربری یا ایمیل
                  </label>
                  <input
                    type="text"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="مثال: amin_akbari"
                    className="w-full text-xs font-semibold p-3 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#19327d] bg-[#fdfdfd]"
                  />
                </div>

                {/* 3. Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0d1e43] flex items-center gap-1.5">
                    کلمه عبور
                  </label>
                  <input
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="پیشفرض: 123456"
                    className="w-full text-xs font-semibold p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#19327d] bg-[#fdfdfd]"
                  />
                </div>

                {/* 4. Role Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0d1e43] flex items-center gap-1.5">
                    نقش کاربری
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewUserRole('user')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        newUserRole === 'user'
                          ? 'bg-[#f5f8ff] border-[#19327d] text-[#19327d]'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Users className="w-4 h-4 shrink-0" />
                      <span>زبان‌آموز</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserRole('admin')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        newUserRole === 'admin'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>مدیر سیستم</span>
                    </button>
                  </div>
                </div>

                {/* 5. Verification status Toggle */}
                <div className="flex items-center justify-between bg-[#f8fafc] border border-gray-100 p-3.5 rounded-2xl">
                  <div className="flex gap-2 items-center">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-xs text-[#0d1e43]">تایید حساب کاربر</h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewUserVerified(!newUserVerified)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 flex ${newUserVerified ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'}`}
                  >
                    <div className="bg-white w-5 h-5 rounded-full shadow-sm"></div>
                  </button>
                </div>

              </div>

              {/* Actions Footer */}
              <div className="border-t border-[#dee3eb] bg-gray-50/70 p-6 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={async () => {
                    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) {
                      showToast('لطفا تمامی فیلدها را با دقت تکمیل کنید.', 'error');
                      return;
                    }
                    if (newUserPassword.length < 6) {
                      showToast('رمز عبور باید حداقل ۶ کاراکتر باشد.', 'error');
                      return;
                    }

                    setIsAddingUser(true);
                    try {
                      await apiFetch('/api/auth/register', {
                        method: 'POST',
                        body: JSON.stringify({
                          fullName: newUserName.trim(),
                          username: newUserUsername.trim(),
                          password: newUserPassword,
                          role: newUserRole,
                          isVerified: newUserVerified
                        })
                      });

                      fetchAdminUsers();
                      setShowAddUserModal(false);
                      showToast('حساب کاربر جدید با موفقیت ایجاد گردید.', 'success');
                    } catch (e) {
                      showToast(e.message || 'خطا در ثبت نام کاربر جدید', 'error');
                    } finally {
                      setIsAddingUser(false);
                    }
                  }}
                  disabled={isAddingUser}
                  className="bg-[#19327d] hover:bg-[#254cb6] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isAddingUser ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin"></div>
                      <span>در حال ثبت...</span>
                    </>
                  ) : (
                    <span>ثبت و ذخیره</span>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
