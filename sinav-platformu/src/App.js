import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

// Tailwind CSS is assumed to be available.
// Lucide React for icons (example usage: <Home className="w-5 h-5" />)
import { Home, ClipboardList, Book, PlusCircle, BarChart2, User, LogOut, CheckCircle, XCircle, Clock, Calendar, Hash, Award, Smile, ChevronRight, ChevronLeft, Save, Trash2, Edit } from 'lucide-react';

// Context for Firebase and User data
const AppContext = createContext();

const AppProvider = ({ children }) => {
    const [app, setApp] = useState(null);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalCallback, setModalCallback] = useState(null);
    const [showNameModal, setShowNameModal] = useState(false); // New state for name input modal

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    // Corrected the reference to __initial_auth_token
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null; 

    useEffect(() => {
        const initializeFirebase = async () => {
            try {
                const firebaseApp = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(firebaseApp);
                const firebaseAuth = getAuth(firebaseApp);

                setApp(firebaseApp);
                setDb(firestoreDb);
                setAuth(firebaseAuth);

                const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
                    if (currentUser) {
                        setUser(currentUser);
                        setUserId(currentUser.uid);
                    } else {
                        // Attempt to sign in with custom token if available, otherwise anonymously
                        if (initialAuthToken) {
                            await signInWithCustomToken(firebaseAuth, initialAuthToken);
                        } else {
                            await signInAnonymously(firebaseAuth);
                        }
                    }
                    setIsAuthReady(true);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Firebase başlatılırken hata oluştu:", error);
                setLoading(false);
                setIsAuthReady(true); // Still set to true to allow UI to render, even with error
            }
        };

        initializeFirebase();
    }, [appId, firebaseConfig, initialAuthToken]);

    const showMessage = (message, callback = null) => {
        setModalMessage(message);
        setModalCallback(() => callback);
        setShowModal(true);
    };

    const confirmAction = (message, onConfirm) => {
        setModalMessage(message);
        setModalCallback(() => () => {
            onConfirm();
            setShowModal(false);
        });
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        if (modalCallback) {
            modalCallback();
        }
        setModalCallback(null);
    };

    if (loading || !isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <AppContext.Provider value={{ db, auth, user, userId, appId, showMessage, confirmAction, setShowNameModal }}>
            {children}
            {showModal && (
                <Modal message={modalMessage} onClose={handleModalClose} onConfirm={modalCallback ? () => modalCallback() : null} />
            )}
        </AppContext.Provider>
    );
};

const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
    </div>
);

const Modal = ({ message, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-auto text-center border-2 border-blue-500">
                {/* Render message conditionally: if string, wrap in <p>; otherwise, render directly in a div */}
                {typeof message === 'string' ? (
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{message}</p>
                ) : (
                    <div className="mb-4">{message}</div> // If message is already JSX, render it directly
                )}
                <div className="flex justify-center space-x-4">
                    {onConfirm && (
                        <button
                            onClick={onConfirm}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition duration-300 transform hover:scale-105 shadow-md"
                        >
                            Evet
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`${onConfirm ? 'bg-gray-300 hover:bg-gray-400 text-gray-800' : 'bg-blue-600 hover:bg-blue-700 text-white'} font-bold py-2 px-6 rounded-full transition duration-300 transform hover:scale-105 shadow-md`}
                    >
                        {onConfirm ? 'Hayır' : 'Tamam'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// New component for student name input
const StudentNameInputModal = ({ onNameSubmit, initialName }) => {
    const [name, setName] = useState(initialName || '');
    const { showMessage } = useContext(AppContext); // Access showMessage here

    const handleSubmit = () => {
        if (name.trim()) {
            onNameSubmit(name.trim());
        } else {
            showMessage("Lütfen adınızı giriniz."); // Replaced alert with showMessage
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-auto text-center border-2 border-blue-500">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Lütfen adınızı girin:</p>
                <input
                    type="text"
                    placeholder="Adınız Soyadınız"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { // Allow submitting with Enter key
                        if (e.key === 'Enter') {
                            handleSubmit();
                        }
                    }}
                />
                <button
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition duration-300 transform hover:scale-105 shadow-md"
                >
                    Devam Et
                </button>
            </div>
        </div>
    );
};

// --- AUTHENTICATION COMPONENTS ---
const AuthPage = ({ onAuthSuccess }) => {
    const { auth, showMessage, userId } = useContext(AppContext);
    const [role, setRole] = useState(null); // 'teacher' or 'student'

    const handleLogin = async (selectedRole) => {
        setRole(selectedRole);
        onAuthSuccess(selectedRole);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md text-center border-4 border-white">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 drop-shadow-lg">
                    Sınav Platformu
                </h1>
                <p className="text-gray-700 dark:text-gray-300 mb-8 text-lg">
                    Giriş yapmak için rolünüzü seçin:
                </p>

                <div className="flex flex-col space-y-6">
                    <button
                        onClick={() => handleLogin('teacher')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-full text-xl shadow-lg transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 group"
                    >
                        <User className="w-7 h-7 text-white group-hover:rotate-6 transition-transform duration-300" />
                        <span>Öğretmen Girişi</span>
                    </button>
                    <button
                        onClick={() => handleLogin('student')}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-full text-xl shadow-lg transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 group"
                    >
                        <User className="w-7 h-7 text-white group-hover:-rotate-6 transition-transform duration-300" />
                        <span>Öğrenci Girişi</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- TEACHER COMPONENTS ---
const TeacherDashboard = ({ setPage }) => {
    const { userId, db, appId, showMessage } = useContext(AppContext);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [totalExams, setTotalExams] = useState(0);
    const [totalSubmissions, setTotalSubmissions] = useState(0);

    useEffect(() => {
        if (!db || !userId) return;

        const fetchCounts = async () => {
            try {
                // Questions count
                const questionsColRef = collection(db, `artifacts/${appId}/users/${userId}/questions`);
                const questionsSnapshot = await getDocs(questionsColRef);
                setTotalQuestions(questionsSnapshot.size);

                // Exams count
                const examsColRef = collection(db, `artifacts/${appId}/users/${userId}/exams`);
                const examsSnapshot = await getDocs(examsColRef);
                setTotalExams(examsSnapshot.size);

                // Submissions count for this teacher's exams
                const submissionsRef = collection(db, `artifacts/${appId}/public/data/examSubmissions`);
                const q = query(submissionsRef, where('teacherId', '==', userId));
                const submissionsSnapshot = await getDocs(q);
                setTotalSubmissions(submissionsSnapshot.size);

            } catch (error) {
                console.error("Dashboard verileri çekilirken hata oluştu:", error);
                showMessage("Dashboard verileri yüklenirken bir hata oluştu.");
            }
        };
        fetchCounts();
    }, [db, userId, appId, showMessage]);

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 border-b-4 border-blue-500 pb-2">
                Öğretmen Paneli
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <DashboardCard
                    title="Toplam Soru"
                    value={totalQuestions}
                    icon={<Book className="w-8 h-8 text-blue-500" />}
                    onClick={() => setPage('questionBank')}
                    color="bg-blue-100 dark:bg-blue-900"
                />
                <DashboardCard
                    title="Toplam Sınav"
                    value={totalExams}
                    icon={<ClipboardList className="w-8 h-8 text-green-500" />}
                    onClick={() => setPage('examsList')}
                    color="bg-green-100 dark:bg-green-900"
                />
                <DashboardCard
                    title="Sınav Cevapları"
                    value={totalSubmissions}
                    icon={<BarChart2 className="w-8 h-8 text-purple-500" />}
                    onClick={() => setPage('examResults')}
                    color="bg-purple-100 dark:bg-purple-900"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuickActionCard
                    title="Yeni Soru Ekle"
                    description="Soru bankanıza yeni bir çoktan seçmeli soru ekleyin."
                    icon={<PlusCircle className="w-6 h-6" />}
                    onClick={() => setPage('addQuestion')}
                    color="from-blue-500 to-indigo-600"
                />
                <QuickActionCard
                    title="Yeni Sınav Oluştur"
                    description="Soru bankanızdan yeni bir sınav hazırlayın."
                    icon={<ClipboardList className="w-6 h-6" />}
                    onClick={() => setPage('createExam')}
                    color="from-green-500 to-teal-600"
                />
            </div>
        </div>
    );
};

const DashboardCard = ({ title, value, icon, onClick, color }) => (
    <div
        className={`flex items-center p-6 rounded-xl shadow-lg cursor-pointer transform transition duration-300 hover:scale-105 ${color} border border-gray-200 dark:border-gray-700`}
        onClick={onClick}
    >
        <div className="p-3 rounded-full bg-white dark:bg-gray-700 shadow-md mr-4">
            {icon}
        </div>
        <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const QuickActionCard = ({ title, description, icon, onClick, color }) => (
    <div
        className={`bg-gradient-to-br ${color} text-white p-6 rounded-xl shadow-lg cursor-pointer transform transition duration-300 hover:scale-105 flex items-start space-x-4`}
        onClick={onClick}
    >
        <div className="p-3 rounded-full bg-white bg-opacity-20 flex-shrink-0">
            {icon}
        </div>
        <div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-sm opacity-90">{description}</p>
        </div>
    </div>
);

const QuestionBank = ({ setPage }) => {
    const { userId, db, appId, showMessage, confirmAction } = useContext(AppContext);
    const [questions, setQuestions] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null);

    useEffect(() => {
        if (!db || !userId) return;

        const questionsRef = collection(db, `artifacts/${appId}/users/${userId}/questions`);
        const q = query(questionsRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setQuestions(fetchedQuestions);
        }, (error) => {
            console.error("Sorular çekilirken hata oluştu:", error);
            showMessage("Sorular yüklenirken bir hata oluştu.");
        });

        return () => unsubscribe();
    }, [db, userId, appId, showMessage]);

    const handleEditQuestion = (question) => {
        setCurrentQuestion(question);
        setIsEditing(true);
        setPage('addQuestion'); // Navigate to add/edit page
    };

    const handleDeleteQuestion = (questionId) => {
        confirmAction("Bu soruyu silmek istediğinizden emin misiniz?", async () => {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/questions`, questionId));
                showMessage("Soru başarıyla silindi!");
            } catch (error) {
                console.error("Soru silinirken hata oluştu:", error);
                showMessage("Soru silinirken bir hata oluştu.");
            }
        });
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 border-b-4 border-blue-500 pb-2">
                Soru Bankası
            </h2>

            <button
                onClick={() => { setCurrentQuestion(null); setIsEditing(false); setPage('addQuestion'); }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-md mb-6 flex items-center space-x-2 transition duration-300 transform hover:scale-105"
            >
                <PlusCircle className="w-5 h-5" />
                <span>Yeni Soru Ekle</span>
            </button>

            {questions.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-lg">Henüz soru eklemediniz.</p>
            ) : (
                <div className="space-y-4">
                    {questions.map((question) => (
                        <div key={question.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="flex-grow mb-4 md:mb-0">
                                <p className="text-gray-800 dark:text-gray-100 font-semibold mb-2">{question.questionText}</p>
                                <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium">
                                        Konu: {question.topic || 'Belirtilmemiş'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex space-x-3 flex-shrink-0">
                                <button
                                    onClick={() => handleEditQuestion(question)}
                                    className="p-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white transition duration-300 transform hover:scale-110"
                                    title="Düzenle"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDeleteQuestion(question.id)}
                                    className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition duration-300 transform hover:scale-110"
                                    title="Sil"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AddEditQuestion = ({ setPage, questionToEdit, isEditing, setIsEditing }) => {
    const { userId, db, appId, showMessage } = useContext(AppContext);
    const [questionText, setQuestionText] = useState(questionToEdit?.questionText || '');
    const [options, setOptions] = useState(questionToEdit?.options || ['', '', '', '']);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState(questionToEdit?.correctAnswerIndex || 0);
    const [topic, setTopic] = useState(questionToEdit?.topic || '');

    useEffect(() => {
        if (isEditing && questionToEdit) {
            setQuestionText(questionToEdit.questionText);
            setOptions(questionToEdit.options);
            setCorrectAnswerIndex(questionToEdit.correctAnswerIndex);
            setTopic(questionToEdit.topic);
        } else {
            setQuestionText('');
            setOptions(['', '', '', '']);
            setCorrectAnswerIndex(0);
            setTopic('');
        }
    }, [isEditing, questionToEdit]);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleAddOption = () => {
        setOptions([...options, '']);
    };

    const handleRemoveOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
        if (correctAnswerIndex >= newOptions.length) {
            setCorrectAnswerIndex(newOptions.length > 0 ? newOptions.length - 1 : 0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!questionText || options.some(opt => !opt.trim()) || topic.trim() === '') {
            showMessage("Lütfen tüm alanları doldurun ve en az bir geçerli şık ekleyin.");
            return;
        }

        const questionData = {
            questionText,
            options: options.map(opt => opt.trim()),
            correctAnswerIndex: parseInt(correctAnswerIndex, 10),
            topic: topic.trim(),
            createdAt: new Date(),
        };

        try {
            if (isEditing && questionToEdit?.id) {
                await setDoc(doc(db, `artifacts/${appId}/users/${userId}/questions`, questionToEdit.id), questionData);
                showMessage("Soru başarıyla güncellendi!");
            } else {
                await addDoc(collection(db, `artifacts/${appId}/users/${userId}/questions`), questionData);
                showMessage("Soru başarıyla eklendi!");
            }
            setPage('questionBank'); // Go back to question bank
            setIsEditing(false); // Reset editing state
            setQuestionText('');
            setOptions(['', '', '', '']);
            setCorrectAnswerIndex(0);
            setTopic('');
        } catch (error) {
            console.error("Soru kaydedilirken hata oluştu:", error);
            showMessage("Soru kaydedilirken bir hata oluştu.");
        }
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 border-b-4 border-blue-500 pb-2">
                {isEditing ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
            </h2>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <div className="mb-6">
                    <label htmlFor="questionText" className="block text-gray-700 dark:text-gray-200 text-lg font-semibold mb-2">
                        Soru Metni:
                    </label>
                    <textarea
                        id="questionText"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        rows="4"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Soruyu buraya yazın..."
                        required
                    ></textarea>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 dark:text-gray-200 text-lg font-semibold mb-3">
                        Şıklar ve Doğru Cevap:
                    </label>
                    {options.map((option, index) => (
                        <div key={index} className="flex items-center mb-3 space-x-3">
                            <input
                                type="radio"
                                name="correctAnswer"
                                id={`option${index}`}
                                value={index}
                                checked={correctAnswerIndex === index}
                                onChange={(e) => setCorrectAnswerIndex(parseInt(e.target.value, 10))}
                                className="form-radio h-5 w-5 text-blue-600 transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-600"
                            />
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                placeholder={`Şık ${index + 1}`}
                                required
                            />
                            {options.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveOption(index)}
                                    className="p-2 text-red-600 hover:text-red-800 transition duration-300 transform hover:scale-110"
                                    title="Şıkkı Kaldır"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={handleAddOption}
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-full mt-2 flex items-center space-x-2 transition duration-300"
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span>Şık Ekle</span>
                    </button>
                </div>

                <div className="mb-6">
                    <label htmlFor="topic" className="block text-gray-700 dark:text-gray-200 text-lg font-semibold mb-2">
                        Konu Alanı:
                    </label>
                    <input
                        type="text"
                        id="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Örn: Matematik - Cebir, Fizik - Mekanik"
                        required
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => setPage('questionBank')}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 transform hover:scale-105"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md flex items-center space-x-2 transition duration-300 transform hover:scale-105"
                    >
                        <Save className="w-5 h-5" />
                        <span>{isEditing ? 'Kaydet' : 'Ekle'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

const CreateExam = ({ setPage }) => {
    const { userId, db, appId, showMessage } = useContext(AppContext);
    const [examName, setExamName] = useState('');
    const [duration, setDuration] = useState(60); // minutes
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [allQuestions, setAllQuestions] = useState([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTopic, setFilterTopic] = useState('');
    const [availableTopics, setAvailableTopics] = useState([]);

    useEffect(() => {
        if (!db || !userId) return;

        const questionsRef = collection(db, `artifacts/${appId}/users/${userId}/questions`);
        const q = query(questionsRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllQuestions(fetchedQuestions);
            const topics = [...new Set(fetchedQuestions.map(q => q.topic).filter(Boolean))];
            setAvailableTopics(topics);
        }, (error) => {
            console.error("Sorular çekilirken hata oluştu:", error);
            showMessage("Sorular yüklenirken bir hata oluştu.");
        });

        return () => unsubscribe();
    }, [db, userId, appId, showMessage]);

    const handleSelectQuestion = (questionId) => {
        setSelectedQuestionIds(prev =>
            prev.includes(questionId)
                ? prev.filter(id => id !== questionId)
                : [...prev, questionId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!examName.trim() || selectedQuestionIds.length === 0 || !startTime || !endTime) {
            showMessage("Lütfen sınav adı, başlangıç/bitiş zamanı girin ve en az bir soru seçin.");
            return;
        }

        const selectedQuestionsFull = selectedQuestionIds.map(id => allQuestions.find(q => q.id === id));
        if (selectedQuestionsFull.some(q => !q)) {
            showMessage("Seçilen bazı sorular bulunamadı. Lütfen tekrar deneyin.");
            return;
        }

        const examData = {
            name: examName.trim(),
            duration: parseInt(duration, 10),
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            questionRefs: selectedQuestionsFull.map(q => ({ id: q.id, topic: q.topic })),
            createdBy: userId,
            createdAt: new Date(),
        };

        try {
            const newExamRef = await addDoc(collection(db, `artifacts/${appId}/users/${userId}/exams`), examData);
            
            // Publish exam to a public collection for student discovery
            await setDoc(doc(db, `artifacts/${appId}/public/data/activeExams`, newExamRef.id), {
                examId: newExamRef.id,
                teacherId: userId,
                name: examName.trim(),
                duration: parseInt(duration, 10),
                startTime: new Date(startTime),
                endTime: new Date(endTime),
            });

            showMessage("Sınav başarıyla oluşturuldu!");
            setPage('examsList'); // Navigate to exams list
        } catch (error) {
            console.error("Sınav oluşturulurken hata oluştu:", error);
            showMessage("Sınav oluşturulurken bir hata oluştu.");
        }
    };

    const filteredQuestions = allQuestions.filter(q =>
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterTopic === '' || q.topic === filterTopic)
    );

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 border-b-4 border-blue-500 pb-2">
                Yeni Sınav Oluştur
            </h2>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="examName" className="block text-gray-700 dark:text-gray-200 text-lg font-semibold mb-2">
                            Sınav Adı:
                        </label>
                        <input
                            type="text"
                            id="examName"
                            value={examName}
                            onChange={(e) => setExamName(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="Örn: 1. Dönem Matematik Sınavı"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-gray-700 dark:text-gray-200 text-lg font-semibold mb-2">
                            Sınav Süresi (Dakika):
                        </label>
                        <input
                            type="number"
                            id="duration"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            min="1"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="startTime" className="block text-gray-700 dark:text-gray-200 text-lg font-semibold mb-2">
                            Başlangıç Zamanı:
                        </label>
                        <input
                            type="datetime-local"
                            id="startTime"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="endTime" className="block text-gray-700 dark:text-gray-200 text-lg font-semibold mb-2">
                            Bitiş Zamanı:
                        </label>
                        <input
                            type="datetime-local"
                            id="endTime"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            required
                        />
                    </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2">Soruları Seçin:</h3>
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Soru ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <select
                        value={filterTopic}
                        onChange={(e) => setFilterTopic(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        <option value="">Tüm Konular</option>
                        {availableTopics.map(topic => (
                            <option key={topic} value={topic}>{topic}</option>
                        ))}
                    </select>
                </div>
                <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-100 dark:bg-gray-700 mb-6">
                    {filteredQuestions.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-400 text-center py-4">Soru bulunamadı veya filtreye uygun soru yok.</p>
                    ) : (
                        filteredQuestions.map(q => (
                            <div key={q.id} className="flex items-center p-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                                <input
                                    type="checkbox"
                                    checked={selectedQuestionIds.includes(q.id)}
                                    onChange={() => handleSelectQuestion(q.id)}
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-500"
                                />
                                <span className="ml-3 text-gray-800 dark:text-gray-100 text-sm">{q.questionText} <span className="text-gray-500 text-xs">({q.topic})</span></span>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => setPage('examsList')}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 transform hover:scale-105"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md flex items-center space-x-2 transition duration-300 transform hover:scale-105"
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span>Sınav Oluştur</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

const ExamsList = ({ setPage, setSelectedExamForDetail }) => {
    const { userId, db, appId, showMessage, confirmAction } = useContext(AppContext);
    const [exams, setExams] = useState([]);

    useEffect(() => {
        if (!db || !userId) return;

        const examsRef = collection(db, `artifacts/${appId}/users/${userId}/exams`);
        const q = query(examsRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedExams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExams(fetchedExams);
        }, (error) => {
            console.error("Sınavlar çekilirken hata oluştu:", error);
            showMessage("Sınavlar yüklenirken bir hata oluştu.");
        });

        return () => unsubscribe();
    }, [db, userId, appId, showMessage]);

    const handleDeleteExam = (examId) => {
        confirmAction("Bu sınavı ve tüm sonuçlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.", async () => {
            try {
                // Delete exam document
                await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/exams`, examId));

                // Also delete from public activeExams collection
                await deleteDoc(doc(db, `artifacts/${appId}/public/data/activeExams`, examId));

                // Optionally, delete associated submissions (more complex, consider leaving them for historical data or a separate cleanup)
                const submissionsRef = collection(db, `artifacts/${appId}/public/data/examSubmissions`);
                const q = query(submissionsRef, where('examId', '==', examId), where('teacherId', '==', userId));
                const submissionsSnapshot = await getDocs(q);
                const deletePromises = submissionsSnapshot.docs.map(sDoc => deleteDoc(doc(db, `artifacts/${appId}/public/data/examSubmissions`, sDoc.id)));
                await Promise.all(deletePromises);

                showMessage("Sınav başarıyla silindi!");
            } catch (error) {
                console.error("Sınav silinirken hata oluştu:", error);
                showMessage("Sınav silinirken bir hata oluştu.");
            }
        });
    };

    const handleViewResults = (exam) => {
        setSelectedExamForDetail(exam);
        setPage('examResultsDetail');
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 border-b-4 border-blue-500 pb-2">
                Sınavlarım
            </h2>

            <button
                onClick={() => setPage('createExam')}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-md mb-6 flex items-center space-x-2 transition duration-300 transform hover:scale-105"
            >
                <PlusCircle className="w-5 h-5" />
                <span>Yeni Sınav Oluştur</span>
            </button>

            {exams.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-lg">Henüz sınav oluşturmadınız.</p>
            ) : (
                <div className="space-y-4">
                    {exams.map((exam) => (
                        <div key={exam.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="flex-grow mb-4 md:mb-0">
                                <p className="text-gray-800 dark:text-gray-100 font-semibold text-xl mb-1">{exam.name}</p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center space-x-1"><Clock className="w-4 h-4" /> <span>{exam.duration} dk</span></span>
                                    <span className="flex items-center space-x-1"><Calendar className="w-4 h-4" /> <span>Başlangıç: {new Date(exam.startTime.seconds * 1000).toLocaleString()}</span></span>
                                    <span className="flex items-center space-x-1"><Calendar className="w-4 h-4" /> <span>Bitiş: {new Date(exam.endTime.seconds * 1000).toLocaleString()}</span></span>
                                    <span className="flex items-center space-x-1"><Hash className="w-4 h-4" /> <span>Soru Sayısı: {exam.questionRefs?.length || 0}</span></span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Sınav Kodu: <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{exam.id}</span> (Öğrencilerinizle paylaşın)</p>
                            </div>
                            <div className="flex space-x-3 flex-shrink-0">
                                <button
                                    onClick={() => handleViewResults(exam)}
                                    className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition duration-300 transform hover:scale-110"
                                    title="Sonuçları Görüntüle"
                                >
                                    <BarChart2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDeleteExam(exam.id)}
                                    className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition duration-300 transform hover:scale-110"
                                    title="Sil"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ExamResults = ({ setPage, setSelectedExamForDetail }) => {
    const { userId, db, appId, showMessage } = useContext(AppContext);
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [examQuestions, setExamQuestions] = useState({}); // Stores full question data for an exam

    useEffect(() => {
        if (!db || !userId) return;

        // Fetch exams created by this teacher
        const examsRef = collection(db, `artifacts/${appId}/users/${userId}/exams`);
        const qExams = query(examsRef);

        const unsubscribeExams = onSnapshot(qExams, (snapshot) => {
            const fetchedExams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExams(fetchedExams);
        }, (error) => {
            console.error("Sınavlar çekilirken hata oluştu:", error);
            showMessage("Sınavlar yüklenirken bir hata oluştu.");
        });

        return () => unsubscribeExams();
    }, [db, userId, appId, showMessage]);

    useEffect(() => {
        if (!db || !selectedExam) {
            setSubmissions([]);
            setExamQuestions({});
            return;
        }

        // Fetch submissions for the selected exam
        const submissionsRef = collection(db, `artifacts/${appId}/public/data/examSubmissions`);
        const qSubmissions = query(submissionsRef, where('examId', '==', selectedExam.id), where('teacherId', '==', userId));

        const unsubscribeSubmissions = onSnapshot(qSubmissions, async (snapshot) => {
            const fetchedSubmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubmissions(fetchedSubmissions);

            // Fetch full question details for the selected exam's questions
            const questionsMap = {};
            if (selectedExam.questionRefs && selectedExam.questionRefs.length > 0) {
                const questionIds = selectedExam.questionRefs.map(qr => qr.id);
                for (const qId of questionIds) {
                    const qDocRef = doc(db, `artifacts/${appId}/users/${userId}/questions`, qId);
                    const qDocSnap = await getDoc(qDocRef);
                    if (qDocSnap.exists()) {
                        questionsMap[qDocSnap.id] = qDocSnap.data();
                    }
                }
            }
            setExamQuestions(questionsMap);

        }, (error) => {
            console.error("Sınav cevapları çekilirken hata oluştu:", error);
            showMessage("Sınav cevapları yüklenirken bir hata oluştu.");
        });

        return () => unsubscribeSubmissions();
    }, [db, userId, appId, selectedExam, showMessage]);

    const calculateTopicScores = (submission) => {
        const topicScores = {}; // { topic: { correct: count, total: count } }

        submission.answers.forEach(answer => {
            const question = examQuestions[answer.questionId];
            if (question) {
                if (!topicScores[question.topic]) {
                    topicScores[question.topic] = { correct: 0, total: 0 };
                }
                topicScores[question.topic].total++;
                if (answer.isCorrect) {
                    topicScores[question.topic].correct++;
                }
            }
        });
        return topicScores;
    };


    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 border-b-4 border-blue-500 pb-2">
                Sınav Sonuçları
            </h2>

            <div className="mb-6">
                <label htmlFor="selectExam" className="block text-gray-700 dark:text-gray-200 text-lg font-semibold mb-2">
                    Sınav Seçin:
                </label>
                <select
                    id="selectExam"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={selectedExam ? selectedExam.id : ''}
                    onChange={(e) => setSelectedExam(exams.find(ex => ex.id === e.target.value))}
                >
                    <option value="">Lütfen bir sınav seçin</option>
                    {exams.map(exam => (
                        <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                </select>
            </div>

            {selectedExam && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{selectedExam.name} - Sonuçlar</h3>
                    {submissions.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-400">Bu sınava henüz kimse girmedi.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tl-lg">Öğrenci Adı</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Puan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doğru</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Yanlış</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tr-lg">Detay</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {submissions.map((submission) => {
                                        const correctCount = submission.answers.filter(a => a.isCorrect).length;
                                        const wrongCount = submission.answers.filter(a => !a.isCorrect).length;
                                        const topicPerformance = calculateTopicScores(submission);
                                        return (
                                            <tr key={submission.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{submission.studentName || 'Anonim Öğrenci'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{submission.score} / {selectedExam.questionRefs?.length || 0}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{correctCount}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{wrongCount}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => showMessage(
                                                            <div>
                                                                <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Öğrenci: {submission.studentName || 'Anonim'}</h4>
                                                                <p className="mb-4 text-gray-700 dark:text-gray-300">Puan: {submission.score} / {selectedExam.questionRefs?.length || 0}</p>
                                                                <h5 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">Konu Bazlı Performans:</h5>
                                                                {Object.keys(topicPerformance).length > 0 ? (
                                                                    Object.entries(topicPerformance).map(([topic, data]) => (
                                                                        <p key={topic} className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                                            <span className="font-medium text-gray-800 dark:text-gray-200">{topic}:</span> {data.correct} doğru / {data.total} toplam ({((data.correct / data.total) * 100).toFixed(0)}%)
                                                                        </p>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Konu performansı verisi yok.</p>
                                                                )}
                                                                <h5 className="font-semibold text-lg mt-4 mb-2 text-gray-800 dark:text-gray-200">Yanlış Cevaplanan Sorular:</h5>
                                                                {submission.answers.filter(a => !a.isCorrect).length > 0 ? (
                                                                    submission.answers.filter(a => !a.isCorrect).map((ans, idx) => {
                                                                        const question = examQuestions[ans.questionId];
                                                                        if (!question) return null;
                                                                        return (
                                                                            <div key={idx} className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 text-left">
                                                                                <p className="font-medium text-gray-800 dark:text-gray-200">{question.questionText}</p>
                                                                                <p className="text-sm text-red-600 dark:text-red-400">Seçilen: {question.options[ans.selectedAnswerIndex]}</p>
                                                                                <p className="text-sm text-green-600 dark:text-green-400">Doğru: {question.options[question.correctAnswerIndex]}</p>
                                                                            </div>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Tüm sorulara doğru cevap verilmiş!</p>
                                                                )}
                                                            </div>
                                                        )}
                                                        className="text-blue-600 hover:text-blue-900 transition duration-300"
                                                    >
                                                        Detaylar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- STUDENT COMPONENTS ---
const StudentDashboard = ({ setPage, setCurrentExamId, studentName }) => {
    const { userId, db, appId, showMessage } = useContext(AppContext);
    const [availableExams, setAvailableExams] = useState([]); // This state is no longer explicitly used for display but for search
    const [completedExams, setCompletedExams] = useState([]);
    const [examCode, setExamCode] = useState('');

    useEffect(() => {
        if (!db || !userId) return;

        // Fetch completed exams for this student
        const submissionsRef = collection(db, `artifacts/${appId}/public/data/examSubmissions`);
        const qCompleted = query(submissionsRef, where('studentId', '==', userId));

        const unsubscribeCompleted = onSnapshot(qCompleted, async (snapshot) => {
            const fetchedSubmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const fetchedCompletedExams = [];
            for (const sub of fetchedSubmissions) {
                // Fetch the actual exam details using teacherId and examId
                if (sub.teacherId && sub.examId) {
                    const examDocRef = doc(db, `artifacts/${appId}/users/${sub.teacherId}/exams`, sub.examId);
                    const examDocSnap = await getDoc(examDocRef);
                    if (examDocSnap.exists()) {
                        fetchedCompletedExams.push({ ...examDocSnap.data(), id: examDocSnap.id, submission: sub });
                    }
                }
            }
            setCompletedExams(fetchedCompletedExams);
        }, (error) => {
            console.error("Tamamlanmış sınavlar çekilirken hata oluştu:", error);
            showMessage("Tamamlanmış sınavlar yüklenirken bir hata oluştu.");
        });

        return () => unsubscribeCompleted();
    }, [db, userId, appId, showMessage]);

    const handleJoinExam = async () => {
        if (!examCode.trim()) {
            showMessage("Lütfen sınav kodunu giriniz.");
            return;
        }

        try {
            // Query the public activeExams collection directly
            const activeExamRef = doc(db, `artifacts/${appId}/public/data/activeExams`, examCode.trim());
            const activeExamSnap = await getDoc(activeExamRef);

            if (activeExamSnap.exists()) {
                const foundExamPublic = activeExamSnap.data();

                // Now fetch the full exam details from the teacher's collection
                const examDocRef = doc(db, `artifacts/${appId}/users/${foundExamPublic.teacherId}/exams`, foundExamPublic.examId);
                const examDocSnap = await getDoc(examDocRef);

                if (!examDocSnap.exists()) {
                     // This case should ideally not happen if activeExams is correctly maintained
                    showMessage("Sınav detayı bulunamadı. Lütfen öğretmeninizle iletişime geçin.");
                    return;
                }
                const foundExam = { id: examDocSnap.id, ...examDocSnap.data() };


                const currentTime = new Date();
                // Ensure startTime and endTime are Date objects for comparison
                const examStartTime = new Date(foundExam.startTime.seconds * 1000);
                const examEndTime = new Date(foundExam.endTime.seconds * 1000);

                if (currentTime < examStartTime) {
                    showMessage("Sınav henüz başlamadı. Başlangıç zamanı: " + examStartTime.toLocaleString());
                    return;
                }
                if (currentTime > examEndTime) {
                    showMessage("Sınav süresi doldu. Bitiş zamanı: " + examEndTime.toLocaleString());
                    return;
                }

                // Check if student has already submitted for this exam
                const existingSubmissionQuery = query(
                    collection(db, `artifacts/${appId}/public/data/examSubmissions`),
                    where('examId', '==', foundExam.id),
                    where('teacherId', '==', foundExamPublic.teacherId),
                    where('studentId', '==', userId)
                );
                const existingSubmissionSnapshot = await getDocs(existingSubmissionQuery);
                if (!existingSubmissionSnapshot.empty) {
                    showMessage("Bu sınava zaten katıldınız. Sonuçlarınızı 'Tamamlanmış Sınavlar' bölümünde görebilirsiniz.");
                    return;
                }

                setCurrentExamId({ examId: foundExam.id, teacherId: foundExamPublic.teacherId });
                setPage('takeExam');
            } else {
                showMessage("Geçersiz sınav kodu.");
            }
        } catch (error) {
            console.error("Sınav bulunurken hata oluştu:", error);
            showMessage("Sınav bulunurken bir hata oluştu. Lütfen kodunuzu kontrol edin veya internet bağlantınızı kontrol edin.");
        }
    };

    const studentAnonId = userId.substring(0, 8); // Display short ID for student

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 border-b-4 border-blue-500 pb-2">
                Öğrenci Paneli
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Öğrenci ID'niz: <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{userId}</span>
            </p>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Sınava Katıl</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">Öğretmeninizden aldığınız sınav kodunu girin:</p>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <input
                        type="text"
                        value={examCode}
                        onChange={(e) => setExamCode(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Sınav Kodu"
                    />
                    <button
                        onClick={handleJoinExam}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md flex items-center justify-center space-x-2 transition duration-300 transform hover:scale-105"
                    >
                        <ChevronRight className="w-5 h-5" />
                        <span>Sınava Başla</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Tamamlanmış Sınavlar</h3>
                {completedExams.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">Henüz tamamlanmış sınavınız yok.</p>
                ) : (
                    <div className="space-y-4">
                        {completedExams.map(exam => (
                            <div key={exam.submission.id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div className="mb-2 md:mb-0">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{exam.name}</p>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">Puan: {exam.submission.score} / {exam.questionRefs?.length || 0}</p>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs">Katılım: {new Date(exam.submission.submittedAt.seconds * 1000).toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setPage('studentExamResultDetail');
                                        setCurrentExamId({ examId: exam.id, teacherId: exam.createdBy, submissionId: exam.submission.id });
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full text-sm shadow-md transition duration-300 transform hover:scale-105"
                                >
                                    Sonuçları Gör
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const TakeExam = ({ setPage, currentExamId, studentName, userId }) => {
    const { db, appId, showMessage } = useContext(AppContext);
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: selectedOptionIndex }
    const [timeLeft, setTimeLeft] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);
    const [examStarted, setExamStarted] = useState(false);
    const [examFinished, setExamFinished] = useState(false);

    useEffect(() => {
        if (!db || !currentExamId) {
            showMessage("Sınav bilgisi eksik.");
            setPage('studentDashboard');
            return;
        }

        const fetchExam = async () => {
            try {
                const examDocRef = doc(db, `artifacts/${appId}/users/${currentExamId.teacherId}/exams`, currentExamId.examId);
                const examDocSnap = await getDoc(examDocRef);

                if (examDocSnap.exists()) {
                    const fetchedExam = { id: examDocSnap.id, ...examDocSnap.data() };
                    setExam(fetchedExam);

                    const qPromises = fetchedExam.questionRefs.map(qr =>
                        getDoc(doc(db, `artifacts/${appId}/users/${currentExamId.teacherId}/questions`, qr.id))
                    );
                    const qSnaps = await Promise.all(qPromises);
                    const fetchedQuestions = qSnaps
                        .filter(snap => snap.exists())
                        .map(snap => ({ id: snap.id, ...snap.data() }));
                    setQuestions(fetchedQuestions);

                    // Set initial time left based on exam duration
                    setTimeLeft(fetchedExam.duration * 60); // Convert minutes to seconds
                    setExamStarted(true); // Auto-start the exam once loaded
                } else {
                    showMessage("Sınav bulunamadı.");
                    setPage('studentDashboard');
                }
            } catch (error) {
                console.error("Sınav yüklenirken hata oluştu:", error);
                showMessage("Sınav yüklenirken bir hata oluştu.");
                setPage('studentDashboard');
            }
        };

        fetchExam();

        // Cleanup on unmount or when examId changes
        return () => {
            if (timerInterval) clearInterval(timerInterval);
        };
    }, [db, appId, currentExamId, setPage, showMessage, userId]);

    useEffect(() => {
        if (examStarted && timeLeft > 0 && !examFinished) {
            const interval = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(interval);
                        handleSubmitExam(true); // Submit if time runs out
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
            setTimerInterval(interval);
            return () => clearInterval(interval);
        } else if (timeLeft === 0 && examStarted && !examFinished) {
            handleSubmitExam(true); // Ensure submission if timer hits zero
        }
    }, [examStarted, timeLeft, examFinished, db, appId, currentExamId, studentName, userId]); // Added missing dependencies to useEffect

    const handleAnswerSelect = (questionId, optionIndex) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSubmitExam = async (timeUp = false) => {
        if (examFinished) return; // Prevent double submission
        setExamFinished(true);
        if (timerInterval) clearInterval(timerInterval);

        let score = 0;
        const answersToSubmit = [];
        const topicScores = {}; // For topic-based analysis

        questions.forEach(q => {
            const selectedIndex = selectedAnswers[q.id];
            const isCorrect = selectedIndex === q.correctAnswerIndex;
            answersToSubmit.push({
                questionId: q.id,
                selectedAnswerIndex: selectedIndex !== undefined ? selectedIndex : -1, // -1 for unanswered
                isCorrect: isCorrect
            });

            if (isCorrect) {
                score++;
            }

            // Update topic scores for this student
            if (!topicScores[q.topic]) {
                topicScores[q.topic] = { correct: 0, total: 0 };
            }
            topicScores[q.topic].total++;
            if (isCorrect) {
                topicScores[q.topic].correct++;
            }
        });

        const submissionData = {
            examId: exam.id,
            teacherId: currentExamId.teacherId, // Store teacherId for easy lookup
            studentId: userId,
            studentName: studentName || 'Anonim Öğrenci', // Student can provide a name or use anonymous ID
            answers: answersToSubmit,
            score: score,
            topicScores: topicScores,
            submittedAt: new Date()
        };

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/examSubmissions`), submissionData);
            showMessage(`Sınav tamamlandı! Puanınız: ${score}/${questions.length}`);
            setPage('studentDashboard'); // Redirect to student dashboard
        } catch (error) {
            console.error("Sınav cevapları kaydedilirken hata oluştu:", error);
            showMessage("Sınav sonuçları kaydedilirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.");
            // If submission fails, still redirect, but user knows there was an issue
            setPage('studentDashboard');
        }
    };

    if (!exam) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <LoadingSpinner />
                <p className="ml-4 text-gray-700 dark:text-gray-300">Sınav yükleniyor...</p>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner flex flex-col">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md mb-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-grow">
                    {exam.name}
                </h2>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-2">
                    <Clock className="w-6 h-6" />
                    <span>{formatTime(timeLeft)}</span>
                </div>
            </div>

            {examFinished ? (
                <div className="flex flex-col items-center justify-center flex-grow bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 text-center">
                    <CheckCircle className="w-24 h-24 text-green-500 mb-6 animate-bounce" />
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">Sınav Tamamlandı!</h3>
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">Sonuçlarınız kaydedildi.</p>
                    <button
                        onClick={() => setPage('studentDashboard')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
                    >
                        Panele Dön
                    </button>
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex-grow mb-6">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Soru {currentQuestionIndex + 1} / {questions.length}</p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                            {currentQuestion?.questionText}
                        </p>
                        <div className="space-y-4">
                            {currentQuestion?.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition duration-200
                                        ${selectedAnswers[currentQuestion.id] === index
                                            ? 'bg-blue-100 dark:bg-blue-700 border-blue-500 dark:border-blue-400 text-blue-800 dark:text-blue-100 shadow-md'
                                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:border-blue-400'
                                        }
                                        font-medium text-lg`}
                                >
                                    {String.fromCharCode(65 + index)}. {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between mt-auto">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-bold py-3 px-6 rounded-full shadow-md flex items-center space-x-2 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span>Önceki</span>
                        </button>
                        {currentQuestionIndex < questions.length - 1 ? (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md flex items-center space-x-2 transition duration-300 transform hover:scale-105"
                            >
                                <span>Sonraki</span>
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={() => handleSubmitExam()}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-md flex items-center space-x-2 transition duration-300 transform hover:scale-105"
                            >
                                <CheckCircle className="w-5 h-5" />
                                <span>Sınavı Bitir</span>
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const StudentExamResultDetail = ({ setPage, currentExamId }) => {
    const { userId, db, appId, showMessage } = useContext(AppContext);
    const [submission, setSubmission] = useState(null);
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState({}); // Full question data map

    useEffect(() => {
        if (!db || !currentExamId?.submissionId || !currentExamId?.examId || !currentExamId?.teacherId) {
            showMessage("Sonuç detayı için bilgi eksik.");
            setPage('studentDashboard');
            return;
        }

        const fetchResultDetails = async () => {
            try {
                // Fetch submission
                const submissionDocRef = doc(db, `artifacts/${appId}/public/data/examSubmissions`, currentExamId.submissionId);
                const submissionDocSnap = await getDoc(submissionDocRef);
                if (!submissionDocSnap.exists()) {
                    showMessage("Sınav cevabı bulunamadı.");
                    setPage('studentDashboard');
                    return;
                }
                const fetchedSubmission = { id: submissionDocSnap.id, ...submissionDocSnap.data() };
                setSubmission(fetchedSubmission);

                // Fetch exam details using the teacherId from the submission
                const examDocRef = doc(db, `artifacts/${appId}/users/${fetchedSubmission.teacherId}/exams`, fetchedSubmission.examId);
                const examDocSnap = await getDoc(examDocRef);
                if (!examDocSnap.exists()) {
                    showMessage("Sınav detayı bulunamadı.");
                    setPage('studentDashboard');
                    return;
                }
                const fetchedExam = { id: examDocSnap.id, ...examDocSnap.data() };
                setExam(fetchedExam);

                // Fetch all questions for this exam
                const qPromises = fetchedExam.questionRefs.map(qr =>
                    getDoc(doc(db, `artifacts/${appId}/users/${fetchedSubmission.teacherId}/questions`, qr.id))
                );
                const qSnaps = await Promise.all(qPromises);
                const questionsMap = {};
                qSnaps.forEach(snap => {
                    if (snap.exists()) {
                        questionsMap[snap.id] = snap.data();
                    }
                });
                setQuestions(questionsMap);

            } catch (error) {
                console.error("Sınav sonuç detayları çekilirken hata oluştu:", error);
                showMessage("Sınav sonuç detayları yüklenirken bir hata oluştu.");
                setPage('studentDashboard');
            }
        };

        fetchResultDetails();
    }, [db, appId, currentExamId, setPage, showMessage, userId]);

    if (!submission || !exam || Object.keys(questions).length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <LoadingSpinner />
                <p className="ml-4 text-gray-700 dark:text-gray-300">Sonuçlar yükleniyor...</p>
            </div>
        );
    }

    const topicPerformance = submission.topicScores || {}; // Use directly from submission

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 border-b-4 border-blue-500 pb-2">
                Sınav Sonucunuz
            </h2>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{exam.name}</h3>
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">Puanınız: <span className="font-bold text-blue-600 dark:text-blue-400">{submission.score} / {exam.questionRefs?.length || 0}</span></p>
                <p className="text-md text-gray-600 dark:text-gray-400 mb-4">Tamamlama Tarihi: {new Date(submission.submittedAt.seconds * 1000).toLocaleString()}</p>

                <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 border-b pb-2">Konu Bazlı Performansınız:</h4>
                {Object.keys(topicPerformance).length > 0 ? (
                    Object.entries(topicPerformance).map(([topic, data]) => (
                        <div key={topic} className="flex items-center mb-2">
                            <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[150px]">{topic}:</span>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                                <div
                                    className="bg-blue-500 h-4 rounded-full"
                                    style={{ width: `${((data.correct / data.total) * 100).toFixed(0)}%` }}
                                ></div>
                                <span className="absolute right-2 top-0 text-xs font-semibold text-gray-800 dark:text-gray-100 leading-4">
                                    {data.correct} / {data.total} ({((data.correct / data.total) * 100).toFixed(0)}%)
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-600 dark:text-gray-400">Konu bazlı performans verisi bulunamadı.</p>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 border-b pb-2">Cevaplarınız ve Doğrular:</h4>
                {submission.answers.map((answer, index) => {
                    const question = questions[answer.questionId];
                    if (!question) return null;

                    const isCorrect = answer.isCorrect;
                    const selectedOptionText = answer.selectedAnswerIndex !== -1 ? question.options[answer.selectedAnswerIndex] : "Cevaplanmadı";
                    const correctOptionText = question.options[question.correctAnswerIndex];

                    return (
                        <div key={index} className={`mb-4 p-4 rounded-lg border-2 ${isCorrect ? 'border-green-400 bg-green-50 dark:bg-green-900' : 'border-red-400 bg-red-50 dark:bg-red-900'}`}>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Soru {index + 1}: {question.questionText}
                            </p>
                            <p className={`text-sm ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'} font-medium`}>
                                Seçilen Cevap: {selectedOptionText}
                            </p>
                            {!isCorrect && (
                                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                                    Doğru Cevap: {correctOptionText}
                                </p>
                            )}
                            <div className="flex items-center mt-2">
                                {isCorrect ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                )}
                                <span className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'} font-bold`}>
                                    {isCorrect ? 'Doğru' : 'Yanlış'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={() => setPage('studentDashboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
                >
                    Panele Geri Dön
                </button>
            </div>
        </div>
    );
};

const Navbar = ({ setPage, role, onLogout, userId }) => {
    return (
        <nav className="bg-gray-900 text-white p-4 shadow-lg sticky top-0 z-40">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-3 md:mb-0">
                    <Award className="w-8 h-8 text-yellow-400 mr-3" />
                    <span className="text-2xl font-bold text-white tracking-wide">Sınav Platformu</span>
                </div>

                <ul className="flex flex-wrap justify-center md:justify-end items-center space-x-4 md:space-x-6 text-lg font-medium">
                    {role === 'teacher' && (
                        <>
                            <li>
                                <button onClick={() => setPage('teacherDashboard')} className="flex items-center space-x-2 text-gray-300 hover:text-white transition duration-200">
                                    <Home className="w-5 h-5" />
                                    <span>Anasayfa</span>
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setPage('questionBank')} className="flex items-center space-x-2 text-gray-300 hover:text-white transition duration-200">
                                    <Book className="w-5 h-5" />
                                    <span>Soru Bankası</span>
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setPage('examsList')} className="flex items-center space-x-2 text-gray-300 hover:text-white transition duration-200">
                                    <ClipboardList className="w-5 h-5" />
                                    <span>Sınavlarım</span>
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setPage('examResults')} className="flex items-center space-x-2 text-gray-300 hover:text-white transition duration-200">
                                    <BarChart2 className="w-5 h-5" />
                                    <span>Sonuçlar</span>
                                </button>
                            </li>
                        </>
                    )}
                    {role === 'student' && (
                        <li>
                            <button onClick={() => setPage('studentDashboard')} className="flex items-center space-x-2 text-gray-300 hover:text-white transition duration-200">
                                <Home className="w-5 h-5" />
                                <span>Anasayfa</span>
                            </button>
                        </li>
                    )}
                    {userId && (
                        <li>
                            <button onClick={onLogout} className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition duration-200">
                                <LogOut className="w-5 h-5" />
                                <span>Çıkış Yap</span>
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

const App = () => {
    const { user, auth, showMessage, setShowNameModal } = useContext(AppContext); // Destructure setShowNameModal
    const [currentPage, setCurrentPage] = useState('auth'); // 'auth', 'teacherDashboard', 'studentDashboard', etc.
    const [role, setRole] = useState(null); // 'teacher' or 'student'
    const [questionToEdit, setQuestionToEdit] = useState(null);
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [selectedExamForDetail, setSelectedExamForDetail] = useState(null); // For teacher results
    const [currentExamId, setCurrentExamId] = useState(null); // {examId, teacherId} for student take/view result
    const [studentName, setStudentName] = useState(''); // Simple student name input for anonymous sessions

    useEffect(() => {
        if (user && user.uid) {
            const savedRole = localStorage.getItem('userRole');
            if (savedRole) {
                setRole(savedRole);
                if (savedRole === 'teacher') {
                    setCurrentPage('teacherDashboard');
                } else {
                    const savedStudentName = localStorage.getItem('studentName');
                    if (savedStudentName) {
                        setStudentName(savedStudentName);
                        setCurrentPage('studentDashboard');
                    } else {
                        // If role is student but no name saved, prompt for name
                        setShowNameModal(true); // Show the dedicated name input modal
                        // Do not set currentPage here. The modal will handle the flow.
                    }
                }
            } else {
                setCurrentPage('auth');
            }
        }
    }, [user, setShowNameModal]);

    const handleAuthSuccess = (selectedRole) => {
        setRole(selectedRole);
        localStorage.setItem('userRole', selectedRole); // Persist role
        if (selectedRole === 'teacher') {
            setCurrentPage('teacherDashboard');
        } else {
            // For student, prompt for name, then go to dashboard
            setShowNameModal(true); // Show the dedicated name input modal
            // Do not set currentPage here. The modal will handle the flow.
        }
    };

    const handleStudentNameSubmit = (name) => {
        setStudentName(name);
        localStorage.setItem('studentName', name); // Persist student name
        setShowNameModal(false); // Close the modal
        setCurrentPage('studentDashboard'); // Navigate to dashboard AFTER name is submitted
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('userRole'); // Clear role from storage
            localStorage.removeItem('studentName'); // Clear student name
            setRole(null);
            setCurrentPage('auth');
            setQuestionToEdit(null);
            setIsEditingQuestion(false);
            setSelectedExamForDetail(null);
            setCurrentExamId(null);
            setStudentName('');
            showMessage("Başarıyla çıkış yapıldı.");
        } catch (error) {
            console.error("Çıkış yapılırken hata oluştu:", error);
            showMessage("Çıkış yapılırken bir hata oluştu.");
        }
    };

    const navigateTo = (page, question = null) => {
        if (page === 'addQuestion' && question) {
            setQuestionToEdit(question);
            setIsEditingQuestion(true);
        } else {
            setQuestionToEdit(null);
            setIsEditingQuestion(false);
        }
        setCurrentPage(page);
    };

    // Main Page Routing
    const renderPage = () => {
        if (!user && currentPage !== 'auth') {
            return <AuthPage onAuthSuccess={handleAuthSuccess} />;
        }

        switch (currentPage) {
            case 'auth':
                return <AuthPage onAuthSuccess={handleAuthSuccess} />;
            case 'teacherDashboard':
                if (role !== 'teacher') return <AuthPage onAuthSuccess={handleAuthSuccess} />;
                return <TeacherDashboard setPage={navigateTo} />;
            case 'questionBank':
                if (role !== 'teacher') return <AuthPage onAuthSuccess={handleAuthSuccess} />;
                return <QuestionBank setPage={navigateTo} />;
            case 'addQuestion':
                if (role !== 'teacher') return <AuthPage onAuthSuccess={handleAuthSuccess} />;
                return <AddEditQuestion setPage={navigateTo} questionToEdit={questionToEdit} isEditing={isEditingQuestion} setIsEditing={setIsEditingQuestion} />;
            case 'createExam':
                if (role !== 'teacher') return <AuthPage onAuthSuccess={handleAuthSuccess} />;
                return <CreateExam setPage={navigateTo} />;
            case 'examsList':
                if (role !== 'teacher') return <AuthPage onAuthSuccess={handleAuthSuccess} />;
                return <ExamsList setPage={navigateTo} setSelectedExamForDetail={setSelectedExamForDetail} />;
            case 'examResults':
                if (role !== 'teacher') return <AuthPage onAuthSuccess={handleAuthSuccess} />;
                return <ExamResults setPage={navigateTo} setSelectedExamForDetail={setSelectedExamForDetail} />;
            case 'studentDashboard':
                if (role !== 'student') return <AuthPage onAuthSuccess={handleAuthSuccess} />;
                return <StudentDashboard setPage={navigateTo} setCurrentExamId={setCurrentExamId} studentName={studentName} />;
            case 'takeExam':
                if (role !== 'student' || !currentExamId) return <AuthPage onAuthSuccess={handleAuthSuccess} />;
                return <TakeExam setPage={navigateTo} currentExamId={currentExamId} studentName={studentName} userId={user?.uid} />;
            case 'studentExamResultDetail':
                if (role !== 'student' || !currentExamId) return <AuthPage onAuthSuccess={handleAuthSuccess} />;
                return <StudentExamResultDetail setPage={navigateTo} currentExamId={currentExamId} />;
            default:
                return <AuthPage onAuthSuccess={handleAuthSuccess} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-inter antialiased">
            {role && <Navbar setPage={navigateTo} role={role} onLogout={handleLogout} userId={user?.uid} />}
            <div className="container mx-auto p-4 sm:p-6 md:p-8 lg:p-10">
                {renderPage()}
            </div>
            {/* Render StudentNameInputModal conditionally. Only show if role is student, and name is not yet set. Also ensure it shows on auth page if student role is selected there. */}
            {role === 'student' && !studentName && (currentPage === 'studentDashboard' || currentPage === 'auth') && (
                <StudentNameInputModal onNameSubmit={handleStudentNameSubmit} initialName={studentName} />
            )}
        </div>
    );
};

export default function AppWrapper() {
    return (
        <AppProvider>
            <App />
        </AppProvider>
    );
}

