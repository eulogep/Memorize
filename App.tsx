import React, { useState, useCallback, useMemo, useEffect, createContext, useContext } from 'react';
import { UserLevel, Subject, ProgressPoint, Tool, HelpResource, UserDocument, MasteryLevel, Topic, SubjectProgress } from './types';
import { generateStudyNote } from './services/geminiService';
import * as dbService from './services/dbService';
import ProgressChart from './components/ProgressChart';
import { ALL_SUBJECTS, SUBJECT_COLORS, USEFUL_TOOLS, HELP_RESOURCES, SUBJECT_TOPICS, MASTERY_LEVEL_COLORS } from './constants';
import { 
  BookOpenIcon, 
  ChartBarIcon, 
  WrenchScrewdriverIcon, 
  LifebuoyIcon, 
  ArrowLeftIcon,
  SparklesIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
  DocumentTextIcon,
  TrashIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon
} from './components/icons';

type View = 'level-select' | 'dashboard' | 'subject-progress' | 'subject' | 'tools' | 'help' | 'documents';
type Theme = 'light' | 'dark';

interface DisplayUserDocument extends Omit<UserDocument, 'file'> {
  url: string;
}


// --- THEME CONTEXT ---
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};


// --- DUMMY DATA ---
const initialProgress: ProgressPoint[] = [
  { day: 'Lun', xp: 20 }, { day: 'Mar', xp: 45 }, { day: 'Mer', xp: 30 },
  { day: 'Jeu', xp: 60 }, { day: 'Ven', xp: 50 }, { day: 'Sam', xp: 75 }, { day: 'Dim', xp: 15 },
];

// --- COMPONENTS ---

const DocumentPreviewModal: React.FC<{ doc: DisplayUserDocument; onClose: () => void; }> = ({ doc, onClose }) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when doc changes
    setTextContent(null);
    setErrorText(null);
    setIsLoadingText(false);

    const isTextBased = doc.type.startsWith('text/') || doc.type === 'application/json' || doc.type === 'text/markdown';
    if (isTextBased) {
      setIsLoadingText(true);
      dbService.getDocument(doc.id)
        .then(fullDoc => {
          if (fullDoc?.file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              setTextContent(e.target?.result as string);
              setIsLoadingText(false);
            };
            reader.onerror = () => {
              setErrorText('Erreur de lecture du fichier.');
              setIsLoadingText(false);
            }
            reader.readAsText(fullDoc.file);
          } else {
            setErrorText('Document non trouvé dans la base de données.');
            setIsLoadingText(false);
          }
        })
        .catch(() => {
            setErrorText('Impossible de charger le document depuis la base de données.');
            setIsLoadingText(false);
        });
    }
  }, [doc]);

  const renderPreviewContent = () => {
    if (doc.type.startsWith('image/')) {
      return <img src={doc.url} alt={doc.name} className="max-w-full max-h-[80vh] object-contain mx-auto" />;
    }
    if (doc.type === 'application/pdf') {
      return <iframe src={doc.url} title={doc.name} className="w-full h-[80vh] border-0" />;
    }
    if (isLoadingText) {
      return <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>;
    }
    if (errorText) {
        return <p className="text-red-500 text-center">{errorText}</p>;
    }
    if (textContent !== null) {
      return <pre className="whitespace-pre-wrap text-sm p-4 bg-slate-100 dark:bg-slate-900/50 rounded-md overflow-auto max-h-[80vh] font-mono">{textContent}</pre>;
    }
    return <p className="text-center text-slate-500 dark:text-slate-400">La prévisualisation pour ce type de fichier n'est pas supportée.</p>;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate" title={doc.name}>{doc.name}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Close preview">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-4 overflow-y-auto">
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  );
};


const LevelSelector: React.FC<{ onSelect: (level: UserLevel) => void }> = ({ onSelect }) => {
  const levels = Object.values(UserLevel);
  const descriptions: Record<UserLevel, string> = {
    [UserLevel.Debutant]: "Je n'ai jamais ou très peu codé. Je pars de zéro.",
    [UserLevel.Moyen]: "J'ai quelques bases, mais j'ai besoin de consolider mes connaissances.",
    [UserLevel.Intermediaire]: "Je code régulièrement, je veux approfondir et devenir plus efficace.",
    [UserLevel.Expert]: "Je maîtrise mon domaine et je cherche des défis complexes et de nouvelles perspectives."
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-transparent bg-clip-text">
          Bienvenue sur Memmorizes
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400">Votre compagnon d'apprentissage personnalisé.</p>
      </div>
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-8">Quel est votre niveau actuel ?</h2>
        <div className="space-y-4">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => onSelect(level)}
              className="w-full text-left p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-purple-500 transition-all duration-300 group"
            >
              <h3 className="text-xl font-bold text-purple-600 dark:text-purple-300">{level}</h3>
              <p className="text-slate-500 dark:text-slate-400">{descriptions[level]}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<{ userLevel: UserLevel; userXp: number; onViewChange: (view: View) => void, activeView: View }> = ({ userLevel, userXp, onViewChange, activeView }) => {
  const { theme, toggleTheme } = useTheme();

  const NavItem: React.FC<{ icon: React.FC<{className?:string}>, label: string, view: View }> = ({ icon: Icon, label, view }) => {
    const isActive = activeView === view;
    return (
      <button onClick={() => onViewChange(view)} className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </button>
    );
  };
  
  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="flex items-center space-x-4">
        <SparklesIcon className="w-8 h-8 text-purple-500" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Memmorizes</h1>
      </div>
      <nav className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
        <NavItem icon={ChartBarIcon} label="Dashboard" view="dashboard" />
        <NavItem icon={DocumentTextIcon} label="Mes Documents" view="documents" />
        <NavItem icon={WrenchScrewdriverIcon} label="Outils" view="tools" />
        <NavItem icon={LifebuoyIcon} label="Aide" view="help" />
      </nav>
      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>
        <div className="text-right">
          <div className="text-sm font-semibold text-purple-600 dark:text-purple-300">{userLevel}</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">{userXp} XP</div>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
          <span className="text-xl font-bold">🚀</span>
        </div>
      </div>
    </header>
  );
};

const Dashboard: React.FC<{ onSelectSubject: (subject: Subject) => void, userLevel: UserLevel, userXp: number, theme: Theme, progressData: SubjectProgress[] }> = ({ onSelectSubject, userLevel, userXp, theme, progressData }) => {
  const level = Math.floor(userXp / 100);
  const xpForNextLevel = 100 - (userXp % 100);

  const getSubjectProgress = (subject: Subject) => {
    const subjectData = progressData.find(p => p.subject === subject);
    if (!subjectData || subjectData.topics.length === 0) return { percent: 0, text: "0% Maîtrisé" };

    const masteredCount = subjectData.topics.filter(t => t.mastery === MasteryLevel.Mastered).length;
    const percent = Math.round((masteredCount / subjectData.topics.length) * 100);
    return { percent, text: `${percent}% Maîtrisé` };
  };

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Objectif Quotidien</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Terminer une fiche de révision.</p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Niveau Actuel</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">{`${xpForNextLevel} XP pour le prochain niveau.`}</p>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-purple-500 dark:text-purple-400">Niv. {level}</span>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
              <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${userXp % 100}%` }}></div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Série d'Activité</h3>
            <p className="text-3xl font-bold text-amber-500 dark:text-amber-400 mt-2">🔥 5 Jours</p>
            <p className="text-slate-500 dark:text-slate-400">Continue comme ça !</p>
        </div>
      </div>

      <ProgressChart data={initialProgress} theme={theme} />
      
      <div className="mt-12">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Matières à explorer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ALL_SUBJECTS.map(subject => {
            const colors = SUBJECT_COLORS[subject];
            const progress = getSubjectProgress(subject);
            return (
              <button key={subject} onClick={() => onSelectSubject(subject)} className={`p-6 rounded-2xl ${colors.bg} border ${colors.border} hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 text-left`}>
                <h3 className={`text-2xl font-bold ${colors.text}`}>{subject}</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Approfondissez vos connaissances en {subject.toLowerCase()}.</p>
                 <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-semibold ${colors.text}`}>Progression</span>
                    <span className={`text-sm font-bold ${colors.text}`}>{progress.text}</span>
                  </div>
                  <div className="w-full bg-slate-300/50 dark:bg-slate-700/50 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress.percent}%` }}></div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SubjectProgressView: React.FC<{
  subjectProgress: SubjectProgress;
  onGenerateNote: (topic: Topic) => void;
  onUpdateMastery: (topicId: string, mastery: MasteryLevel) => void;
  onBack: () => void;
}> = ({ subjectProgress, onGenerateNote, onUpdateMastery, onBack }) => {
  if (!subjectProgress) return null;

  const { subject, topics } = subjectProgress;
  const colors = SUBJECT_COLORS[subject];

  return (
    <div className="p-8">
      <button onClick={onBack} className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 mb-8 transition-colors">
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Retour au Dashboard</span>
      </button>
      <div className={`p-6 rounded-2xl ${colors.bg} border ${colors.border} mb-8`}>
        <h2 className={`text-4xl font-extrabold ${colors.text}`}>{subject}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Suivez votre progression et lancez-vous dans de nouveaux sujets.</p>
      </div>

      <div className="space-y-4">
        {topics.map(topic => (
          <div key={topic.id} className="p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${MASTERY_LEVEL_COLORS[topic.mastery].bg} ${MASTERY_LEVEL_COLORS[topic.mastery].text}`}>
                    {topic.mastery}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{topic.name}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <select 
                value={topic.mastery}
                onChange={(e) => onUpdateMastery(topic.id, e.target.value as MasteryLevel)}
                className="bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-md p-2 text-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                {Object.values(MasteryLevel).map(level => <option key={level} value={level}>{level}</option>)}
              </select>
              <button
                onClick={() => onGenerateNote(topic)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center space-x-2"
              >
                <BookOpenIcon className="w-4 h-4" />
                <span>Étudier</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const SubjectView: React.FC<{ subject: Subject; topic: Topic; note: string | null; isLoading: boolean; onBack: () => void; onComplete: (topicId: string) => void; theme: Theme }> = ({ subject, topic, note, isLoading, onBack, onComplete, theme }) => {
    
    const renderNoteContent = () => {
        if (!note) return null;

        const lines = note.split('\n');
        const elements: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeContent = '';
        let listItems: string[] = [];

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1">
                        {listItems.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                );
                listItems = [];
            }
        };

        lines.forEach((line, i) => {
            if (line.trim().startsWith('```')) {
                flushList();
                if (inCodeBlock) {
                    elements.push(
                        <pre key={`code-${i}`} className="!bg-slate-100 dark:!bg-slate-900/70 p-4 rounded-lg font-mono text-sm overflow-x-auto my-4">
                            <code>{codeContent.trim()}</code>
                        </pre>
                    );
                    codeContent = '';
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                }
            } else if (inCodeBlock) {
                codeContent += line + '\n';
            } else if (line.startsWith('**') && line.endsWith('**')) {
                flushList();
                elements.push(<h3 key={i} className="!text-purple-600 dark:!text-purple-300 !mt-6 !mb-2">{line.replace(/\*\*/g, '')}</h3>);
            } else if (line.startsWith('* ')) {
                listItems.push(line.substring(2));
            } else {
                flushList();
                if (line.trim() !== '') {
                    elements.push(<p key={i}>{line}</p>);
                }
            }
        });
        
        flushList();

        if (inCodeBlock && codeContent) {
            elements.push(
                <pre key="code-final" className="!bg-slate-100 dark:!bg-slate-900/70 p-4 rounded-lg font-mono text-sm overflow-x-auto my-4">
                    <code>{codeContent.trim()}</code>
                </pre>
            );
        }

        return elements;
    };
    
    return (
        <div className="p-8">
            <button onClick={onBack} className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 mb-8 transition-colors">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Retour aux sujets de {subject}</span>
            </button>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">Fiche de Révision : <span className="text-purple-500 dark:text-purple-400">{topic.name}</span></h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">Matière : {subject}</p>

            {isLoading && (
                <div className="flex flex-col items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 dark:border-purple-400"></div>
                    <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg">Génération de votre fiche avec Gemini...</p>
                    <p className="text-slate-400 dark:text-slate-500 mt-2">Cela peut prendre quelques instants.</p>
                </div>
            )}
            
            {note && !isLoading && (
                <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} prose-lg max-w-none bg-white dark:bg-slate-800/50 p-8 rounded-2xl mt-8 border border-slate-200 dark:border-slate-700 transition-colors duration-300`}>
                    {renderNoteContent()}
                    <button onClick={() => onComplete(topic.id)} className="mt-8 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 w-full text-lg no-prose">
                        J'ai maîtrisé ce sujet ! (+50 XP)
                    </button>
                </div>
            )}
        </div>
    );
};

const ToolsView: React.FC = () => (
  <div className="p-8">
    <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8">Boîte à Outils</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {USEFUL_TOOLS.map((tool: Tool) => (
        <a href={tool.url} target="_blank" rel="noopener noreferrer" key={tool.name} className="flex items-start space-x-4 p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-purple-500 transition-all duration-300 group">
          <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <tool.icon className="w-6 h-6 text-purple-500 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{tool.name}</h3>
            <p className="text-slate-500 dark:text-slate-400">{tool.description}</p>
          </div>
        </a>
      ))}
    </div>
  </div>
);

const HelpView: React.FC = () => {
    const categories = [...new Set(HELP_RESOURCES.map(r => r.category))];
    return (
        <div className="p-8">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8">Ressources & Aide</h2>
            <div className="space-y-10">
                {categories.map(category => (
                    <div key={category}>
                        <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-300 mb-4">{category}</h3>
                        <div className="space-y-4">
                            {HELP_RESOURCES.filter(r => r.category === category).map((resource: HelpResource) => (
                                <a href={resource.url} target="_blank" rel="noopener noreferrer" key={resource.title} className="flex justify-between items-center p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-purple-500 transition-all duration-300 group">
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">{resource.title}</h4>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl">{resource.description}</p>
                                    </div>
                                    <ChevronRightIcon className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DocumentsView: React.FC<{ 
  documents: DisplayUserDocument[];
  onAddDocument: (file: File) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  onPreviewDocument: (id: string) => void;
}> = ({ documents, onAddDocument, onDeleteDocument, onPreviewDocument }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAddDocument(file);
      event.target.value = '';
    }
  };

  const handleDeleteDocument = async (id: string) => {
    await onDeleteDocument(id);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">Mes Documents</h2>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="application/pdf,image/*,.md,.txt"
        />
        <button
          onClick={handleUploadClick}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Ajouter un document
        </button>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
            <DocumentTextIcon className="mx-auto w-16 h-16 text-slate-400 dark:text-slate-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Aucun document pour le moment.</h3>
            <p className="text-slate-500 dark:text-slate-400">Cliquez sur "Ajouter un document" pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map(doc => (
            <div key={doc.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl group transition-colors">
                <button onClick={() => onPreviewDocument(doc.id)} className="flex items-center space-x-4 flex-grow text-left rounded-lg -m-2 p-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <DocumentTextIcon className="w-8 h-8 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                    <div className="truncate">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate" title={doc.name}>{doc.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Ajouté le {new Date(doc.addedDate).toLocaleDateString()}
                        </p>
                    </div>
                </button>
                <div className="flex items-center ml-4 flex-shrink-0">
                    <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label={`Open ${doc.name} in new tab`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                    </a>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id);
                        }}
                        className="p-2 rounded-full text-slate-400 dark:text-slate-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-2"
                        aria-label={`Supprimer ${doc.name}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// --- MAIN APP LOGIC ---
function AppContent() {
  const { theme } = useTheme();
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [view, setView] = useState<View>('level-select');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [studyNote, setStudyNote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userXp, setUserXp] = useState(230);
  const [documents, setDocuments] = useState<DisplayUserDocument[]>([]);
  const [previewingDoc, setPreviewingDoc] = useState<DisplayUserDocument | null>(null);
  const [progressData, setProgressData] = useState<SubjectProgress[]>([]);

  useEffect(() => {
    if (level) {
      const initialProgressData = ALL_SUBJECTS.map(subject => ({
        subject,
        topics: SUBJECT_TOPICS[subject].map(topicName => ({
          id: `${subject}-${topicName.replace(/\s/g, '-')}`,
          name: topicName,
          mastery: MasteryLevel.NotStarted,
        })),
      }));
      setProgressData(initialProgressData);
    }
  }, [level]);

  useEffect(() => {
    let isMounted = true;
    let objectUrls: string[] = [];

    const loadDocuments = async () => {
      try {
        const docsFromDb = await dbService.getAllDocuments();
        if (isMounted) {
          const displayDocs = docsFromDb.map(doc => {
            const url = URL.createObjectURL(doc.file);
            objectUrls.push(url);
            return {
              id: doc.id,
              name: doc.name,
              type: doc.type,
              size: doc.size,
              addedDate: doc.addedDate,
              url,
            };
          });
          setDocuments(displayDocs);
        }
      } catch (error) {
        console.error("Failed to load documents from IndexedDB", error);
      }
    };
    
    loadDocuments();

    return () => {
      isMounted = false;
      objectUrls.forEach(URL.revokeObjectURL);
    };
  }, []);


  const handleLevelSelect = (selectedLevel: UserLevel) => {
    setLevel(selectedLevel);
    setView('dashboard');
  };

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setView('subject-progress');
  };

  const handleUpdateMastery = useCallback((topicId: string, newMastery: MasteryLevel) => {
    setProgressData(currentProgress => {
        return currentProgress.map(subjectProgress => ({
            ...subjectProgress,
            topics: subjectProgress.topics.map(topic => 
                topic.id === topicId ? { ...topic, mastery: newMastery } : topic
            )
        }));
    });
  }, []);

  const handleGenerateNoteForTopic = useCallback(async (topic: Topic) => {
    if (!level || !selectedSubject) return;
    setSelectedTopic(topic);
    setView('subject');
    setIsLoading(true);
    setError(null);
    setStudyNote(null);
    try {
      const note = await generateStudyNote(level, selectedSubject, topic.name);
      setStudyNote(note);
    } catch (err) {
      setError('Failed to generate study note.');
    } finally {
      setIsLoading(false);
    }
  }, [level, selectedSubject]);

  const handleCompleteNote = (topicId: string) => {
    handleUpdateMastery(topicId, MasteryLevel.Mastered);
    setUserXp(prevXp => prevXp + 50);
    setView('subject-progress');
    setSelectedTopic(null);
    setStudyNote(null);
  };

  const handleAddDocument = async (file: File) => {
    try {
      const newDocument: UserDocument = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        addedDate: new Date().toISOString(),
        file: file,
      };
      await dbService.addDocument(newDocument);
      const url = URL.createObjectURL(file);
      const displayDoc: DisplayUserDocument = { ...newDocument, url };
      setDocuments(prev => [...prev, displayDoc]);
    } catch (error) {
      console.error("Failed to add document", error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      const docToDelete = documents.find(d => d.id === id);
      await dbService.deleteDocument(id);
      if (docToDelete) {
        URL.revokeObjectURL(docToDelete.url);
      }
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (error) {
      console.error("Failed to delete document", error);
    }
  };
  
  const handlePreviewDocument = (docId: string) => {
    const docToPreview = documents.find(d => d.id === docId);
    if (docToPreview) {
        setPreviewingDoc(docToPreview);
    }
  };

  const handleClosePreview = () => {
      setPreviewingDoc(null);
  };


  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard onSelectSubject={handleSelectSubject} userLevel={level!} userXp={userXp} theme={theme} progressData={progressData} />;
      case 'subject-progress': {
          const currentSubjectProgress = progressData.find(p => p.subject === selectedSubject);
          if (!currentSubjectProgress) return null;
          return <SubjectProgressView
              subjectProgress={currentSubjectProgress}
              onGenerateNote={handleGenerateNoteForTopic}
              onUpdateMastery={handleUpdateMastery}
              onBack={() => setView('dashboard')}
          />
      }
      case 'subject':
        return <SubjectView subject={selectedSubject!} topic={selectedTopic!} note={studyNote} isLoading={isLoading} onBack={() => setView('subject-progress')} onComplete={handleCompleteNote} theme={theme} />;
      case 'tools':
        return <ToolsView />;
      case 'help':
        return <HelpView />;
      case 'documents':
        return <DocumentsView documents={documents} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} onPreviewDocument={handlePreviewDocument} />;
      default:
        return null;
    }
  };

  if (!level) {
    return <LevelSelector onSelect={handleLevelSelect} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300 transition-colors duration-300">
      <Header userLevel={level} userXp={userXp} onViewChange={setView} activeView={view} />
      <main>
        {renderContent()}
      </main>
      {previewingDoc && <DocumentPreviewModal doc={previewingDoc} onClose={handleClosePreview} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
