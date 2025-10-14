
import { Subject, Tool, HelpResource, MasteryLevel } from './types';
import { SparklesIcon, WrenchScrewdriverIcon, LifebuoyIcon } from './components/icons';

export const ALL_SUBJECTS: Subject[] = [
  Subject.Python,
  Subject.Java,
  Subject.Maths,
  Subject.Reseau,
  Subject.Systeme,
  Subject.BDD,
];

export const SUBJECT_TOPICS: { [key in Subject]: string[] } = {
  [Subject.Python]: ['Variables & Data Types', 'Operators', 'Control Flow (if/else)', 'Loops (for/while)', 'Functions', 'Data Structures (Lists, Dictionaries)'],
  [Subject.Java]: ['Syntax & Variables', 'Classes & Objects', 'Methods', 'Inheritance', 'Polymorphism', 'Data Structures (Arrays, ArrayLists)'],
  [Subject.Maths]: ['Algebra Basics', 'Linear Equations', 'Quadratic Equations', 'Functions & Graphs', 'Basic Trigonometry', 'Calculus (Derivatives)'],
  [Subject.Reseau]: ['OSI Model', 'TCP/IP Protocol Suite', 'IP Addressing & Subnetting', 'Routing Protocols', 'DNS', 'Network Security Basics'],
  [Subject.Systeme]: ['Processes & Threads', 'Memory Management', 'File Systems', 'Scheduling Algorithms', 'Deadlocks', 'Virtualization'],
  [Subject.BDD]: ['Relational Model', 'SQL Queries (SELECT, FROM, WHERE)', 'JOIN Operations', 'Normalization (1NF, 2NF, 3NF)', 'Transactions & ACID', 'Indexing'],
};

export const MASTERY_LEVEL_COLORS: { [key in MasteryLevel]: { bg: string; text: string; } } = {
    [MasteryLevel.NotStarted]: { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300' },
    [MasteryLevel.InProgress]: { bg: 'bg-blue-200 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300' },
    [MasteryLevel.Completed]: { bg: 'bg-yellow-200 dark:bg-yellow-900/50', text: 'text-yellow-700 dark:text-yellow-300' },
    [MasteryLevel.Mastered]: { bg: 'bg-green-200 dark:bg-green-900/50', text: 'text-green-700 dark:text-green-300' },
};

export const SUBJECT_COLORS: { [key in Subject]: { bg: string; text: string; border: string } } = {
  [Subject.Python]: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
  [Subject.Java]: { bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700' },
  [Subject.Maths]: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
  [Subject.Reseau]: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-700' },
  [Subject.Systeme]: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300', border: 'border-red-200 dark:border-red-700' },
  [Subject.BDD]: { bg: 'bg-teal-100 dark:bg-teal-900/50', text: 'text-teal-800 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-700' },
};

export const USEFUL_TOOLS: Tool[] = [
  { name: 'Figma', description: 'Outil de design collaboratif pour créer des interfaces.', url: 'https://figma.com', icon: SparklesIcon },
  { name: 'Excalidraw', description: 'Tableau blanc virtuel simple pour dessiner des diagrammes.', url: 'https://excalidraw.com', icon: WrenchScrewdriverIcon },
  { name: 'CodePen', description: 'Editeur de code en ligne pour tester des extraits HTML, CSS, JS.', url: 'https://codepen.io', icon: WrenchScrewdriverIcon },
  { name: 'Phind', description: "Moteur de recherche pour développeurs basé sur l'IA.", url: 'https://phind.com', icon: SparklesIcon },
];

export const HELP_RESOURCES: HelpResource[] = [
    { category: 'Emploi', title: 'Student Pop', description: "Plateforme de jobs étudiants flexibles et bien rémunérés.", url: 'https://www.studentpop.fr/' },
    { category: 'Emploi', title: 'Welcome to the Jungle', description: "Trouvez des stages et alternances dans des entreprises innovantes.", url: 'https://www.welcometothejungle.com/fr' },
    { category: 'Besoins du quotidien', title: 'Les Restos du Cœur', description: "Aide alimentaire pour les personnes en difficulté.", url: 'https://www.restosducoeur.org/' },
    { category: 'Besoins du quotidien', title: 'Too Good To Go', description: "Sauvez des invendus alimentaires à petit prix près de chez vous.", url: 'https://www.toogoodtogo.com/fr' },
    { category: 'Administratif', title: 'Service-Public.fr', description: "Le site officiel de l'administration française pour toutes vos démarches.", url: 'https://www.service-public.fr/' },
    { category: 'Administratif', title: 'Info Jeunes', description: "Information et accompagnement pour les jeunes sur tous les sujets.", url: 'https://www.info-jeunes.fr/' },
];
