// FIX: Import React to use React.ComponentType
import React from 'react';

export enum UserLevel {
  Debutant = 'Débutant',
  Moyen = 'Moyen',
  Intermediaire = 'Intermédiaire',
  Expert = 'Expert',
}

export enum Subject {
  Python = 'Python',
  Java = 'Java',
  Maths = 'Mathématiques',
  Reseau = 'Réseau',
  Systeme = "Système d'exploitation",
  BDD = 'Base de données',
}

export enum MasteryLevel {
  NotStarted = 'Non commencé',
  InProgress = 'En cours',
  Completed = 'Terminé',
  Mastered = 'Maîtrisé',
}

export interface Topic {
  id: string;
  name: string;
  mastery: MasteryLevel;
}

export interface SubjectProgress {
  subject: Subject;
  topics: Topic[];
}

export interface ProgressPoint {
  day: string;
  xp: number;
}

export interface Tool {
  name: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface HelpResource {
  category: string;
  title: string;
  description: string;
  url: string;
}

export interface UserDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  addedDate: string;
  file: File;
}