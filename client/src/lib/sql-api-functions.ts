import { sqliteDB } from './sql-db';

// Types
interface FileItem {
  id: number;
  name: string;
  type: "folder" | "pdf" | "image" | "document";
  size?: string;
  path: string;
  created_at: string;
}

interface Folder {
  id: number;
  name: string;
  path: string;
  created_at: string;
}

interface Message {
  id: number;
  text: string;
  timestamp: string;
  sender: "user";
}

interface Subject {
  id: number;
  name: string;
  color: string;
}

interface Chapter {
  id: number;
  subject_id: number;
  title: string;
  description: string;
  progress: number;
  total_questions: number;
  difficulty: string;
}

interface Question {
  id: number;
  chapter_id: number;
  question: string;
  options: string;
  correct_answer: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

interface QuizSession {
  id: number;
  chapter_id: number;
  total_questions: number;
  current_question: number;
  score: number;
  is_completed: boolean;
  created_at: string;
}

interface QuizAnswer {
  id: number;
  session_id: number;
  question_id: number;
  selected_answer: number;
  is_correct: boolean;
}

interface QuizStat {
  id: number;
  date: string;
  chapter_title: string;
  subtopic_title?: string;
  subject_title: string;
  score: number;
  total_questions: number;
  percentage: number;
}

// Message functions
export async function getMessages(): Promise<Message[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM messages ORDER BY timestamp ASC');
}

export async function createMessage(data: { text: string; sender: string }): Promise<Message> {
  await sqliteDB.init();
  const id = sqliteDB.insert(
    'INSERT INTO messages (text, sender) VALUES (?, ?)',
    [data.text, data.sender]
  );
  return sqliteDB.get('SELECT * FROM messages WHERE id = ?', [id]);
}

export async function deleteMessage(id: number): Promise<void> {
  await sqliteDB.init();
  sqliteDB.run('DELETE FROM messages WHERE id = ?', [id]);
}

// File functions
export async function getFiles(): Promise<FileItem[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM files ORDER BY created_at DESC');
}

export async function createFile(data: { name: string; type: string; size?: string; path: string }): Promise<FileItem> {
  await sqliteDB.init();
  const id = sqliteDB.insert(
    'INSERT INTO files (name, type, size, path) VALUES (?, ?, ?, ?)',
    [data.name, data.type, data.size || '', data.path]
  );
  return sqliteDB.get('SELECT * FROM files WHERE id = ?', [id]);
}

export async function deleteFile(id: number): Promise<void> {
  await sqliteDB.init();
  sqliteDB.run('DELETE FROM files WHERE id = ?', [id]);
}

// Folder functions
export async function getFolders(): Promise<Folder[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM folders ORDER BY created_at DESC');
}

export async function createFolder(data: { name: string; path: string }): Promise<Folder> {
  await sqliteDB.init();
  const id = sqliteDB.insert(
    'INSERT INTO folders (name, path) VALUES (?, ?)',
    [data.name, data.path]
  );
  return sqliteDB.get('SELECT * FROM folders WHERE id = ?', [id]);
}

export async function deleteFolder(id: number): Promise<void> {
  await sqliteDB.init();
  sqliteDB.run('DELETE FROM folders WHERE id = ?', [id]);
}

// Subject functions
export async function getSubjects(): Promise<Subject[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM subjects ORDER BY name ASC');
}

export async function createSubject(data: { name: string; color: string }): Promise<Subject> {
  await sqliteDB.init();
  const id = sqliteDB.insert(
    'INSERT INTO subjects (name, color) VALUES (?, ?)',
    [data.name, data.color]
  );
  return sqliteDB.get('SELECT * FROM subjects WHERE id = ?', [id]);
}

export async function updateSubject(id: number, data: { name?: string; color?: string }): Promise<Subject> {
  await sqliteDB.init();
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.name) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.color) {
    updates.push('color = ?');
    params.push(data.color);
  }
  
  params.push(id);
  sqliteDB.run(`UPDATE subjects SET ${updates.join(', ')} WHERE id = ?`, params);
  return sqliteDB.get('SELECT * FROM subjects WHERE id = ?', [id]);
}

export async function deleteSubject(id: number): Promise<void> {
  await sqliteDB.init();
  sqliteDB.run('DELETE FROM subjects WHERE id = ?', [id]);
}

// Chapter functions
export async function getChapters(): Promise<Chapter[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM chapters ORDER BY title ASC');
}

export async function getChaptersBySubject(subjectId: number): Promise<Chapter[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM chapters WHERE subject_id = ? ORDER BY title ASC', [subjectId]);
}

export async function getChapter(id: number): Promise<Chapter | null> {
  await sqliteDB.init();
  return sqliteDB.get('SELECT * FROM chapters WHERE id = ?', [id]);
}

export async function createChapter(data: { 
  subject_id: number; 
  title: string; 
  description: string; 
  difficulty: string;
  total_questions?: number;
}): Promise<Chapter> {
  await sqliteDB.init();
  const id = sqliteDB.insert(
    'INSERT INTO chapters (subject_id, title, description, difficulty, total_questions) VALUES (?, ?, ?, ?, ?)',
    [data.subject_id, data.title, data.description, data.difficulty, data.total_questions || 0]
  );
  return sqliteDB.get('SELECT * FROM chapters WHERE id = ?', [id]);
}

export async function updateChapter(id: number, data: { 
  title?: string; 
  description?: string; 
  progress?: number;
  total_questions?: number;
  difficulty?: string;
}): Promise<Chapter> {
  await sqliteDB.init();
  const updates: string[] = [];
  const params: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  });
  
  params.push(id);
  sqliteDB.run(`UPDATE chapters SET ${updates.join(', ')} WHERE id = ?`, params);
  return sqliteDB.get('SELECT * FROM chapters WHERE id = ?', [id]);
}

export async function deleteChapter(id: number): Promise<void> {
  await sqliteDB.init();
  sqliteDB.run('DELETE FROM chapters WHERE id = ?', [id]);
}

// Question functions
export async function getQuestions(): Promise<Question[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM questions ORDER BY id ASC');
}

export async function getQuestionsByChapter(chapterId: number): Promise<Question[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM questions WHERE chapter_id = ? ORDER BY id ASC', [chapterId]);
}

export async function createQuestion(data: {
  chapter_id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: string;
}): Promise<Question> {
  await sqliteDB.init();
  const id = sqliteDB.insert(
    'INSERT INTO questions (chapter_id, question, options, correct_answer, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?)',
    [data.chapter_id, data.question, JSON.stringify(data.options), data.correct_answer, data.explanation, data.difficulty]
  );
  return sqliteDB.get('SELECT * FROM questions WHERE id = ?', [id]);
}

export async function updateQuestion(id: number, data: {
  question?: string;
  options?: string[];
  correct_answer?: number;
  explanation?: string;
  difficulty?: string;
}): Promise<Question> {
  await sqliteDB.init();
  const updates: string[] = [];
  const params: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(key === 'options' ? JSON.stringify(value) : value);
    }
  });
  
  params.push(id);
  sqliteDB.run(`UPDATE questions SET ${updates.join(', ')} WHERE id = ?`, params);
  return sqliteDB.get('SELECT * FROM questions WHERE id = ?', [id]);
}

export async function deleteQuestion(id: number): Promise<void> {
  await sqliteDB.init();
  sqliteDB.run('DELETE FROM questions WHERE id = ?', [id]);
}

// Quiz Session functions
export async function getQuizSessions(): Promise<QuizSession[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM quiz_sessions ORDER BY created_at DESC');
}

export async function createQuizSession(data: {
  chapter_id: number;
  total_questions: number;
}): Promise<QuizSession> {
  await sqliteDB.init();
  const id = sqliteDB.insert(
    'INSERT INTO quiz_sessions (chapter_id, total_questions) VALUES (?, ?)',
    [data.chapter_id, data.total_questions]
  );
  return sqliteDB.get('SELECT * FROM quiz_sessions WHERE id = ?', [id]);
}

export async function updateQuizSession(id: number, data: {
  current_question?: number;
  score?: number;
  is_completed?: boolean;
}): Promise<QuizSession> {
  await sqliteDB.init();
  const updates: string[] = [];
  const params: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  });
  
  params.push(id);
  sqliteDB.run(`UPDATE quiz_sessions SET ${updates.join(', ')} WHERE id = ?`, params);
  return sqliteDB.get('SELECT * FROM quiz_sessions WHERE id = ?', [id]);
}

export async function deleteQuizSession(id: number): Promise<void> {
  await sqliteDB.init();
  sqliteDB.run('DELETE FROM quiz_sessions WHERE id = ?', [id]);
}

// Quiz Answer functions
export async function getQuizAnswers(): Promise<QuizAnswer[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM quiz_answers ORDER BY id ASC');
}

export async function getQuizAnswersBySession(sessionId: number): Promise<QuizAnswer[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM quiz_answers WHERE session_id = ? ORDER BY id ASC', [sessionId]);
}

export async function createQuizAnswer(data: {
  session_id: number;
  question_id: number;
  selected_answer: number;
  is_correct: boolean;
}): Promise<QuizAnswer> {
  await sqliteDB.init();
  const id = sqliteDB.insert(
    'INSERT INTO quiz_answers (session_id, question_id, selected_answer, is_correct) VALUES (?, ?, ?, ?)',
    [data.session_id, data.question_id, data.selected_answer, data.is_correct]
  );
  return sqliteDB.get('SELECT * FROM quiz_answers WHERE id = ?', [id]);
}

// Quiz Stats functions
export async function getQuizStats(): Promise<QuizStat[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM quiz_stats ORDER BY date DESC');
}

export async function createQuizStat(data: {
  chapter_title: string;
  subtopic_title?: string;
  subject_title: string;
  score: number;
  total_questions: number;
  percentage: number;
}): Promise<QuizStat> {
  await sqliteDB.init();
  const id = sqliteDB.insert(
    'INSERT INTO quiz_stats (chapter_title, subtopic_title, subject_title, score, total_questions, percentage) VALUES (?, ?, ?, ?, ?, ?)',
    [data.chapter_title, data.subtopic_title || null, data.subject_title, data.score, data.total_questions, data.percentage]
  );
  return sqliteDB.get('SELECT * FROM quiz_stats WHERE id = ?', [id]);
}

// Study Sessions functions
export async function getStudySessions(): Promise<any[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM study_sessions ORDER BY created_at DESC');
}

export async function createStudySession(data: {
  chapter_id: number;
  duration: number;
}): Promise<any> {
  await sqliteDB.init();
  const id = sqliteDB.insert(
    'INSERT INTO study_sessions (chapter_id, duration) VALUES (?, ?)',
    [data.chapter_id, data.duration]
  );
  return sqliteDB.get('SELECT * FROM study_sessions WHERE id = ?', [id]);
}

// Schedule Events functions
export async function getScheduleEvents(): Promise<any[]> {
  await sqliteDB.init();
  return sqliteDB.all('SELECT * FROM schedule_events ORDER BY date ASC');
}

export async function createScheduleEvent(data: {
  title: string;
  date: string;
  type?: string;
  description?: string;
}): Promise<any> {
  await sqliteDB.init();
  const id = sqliteDB.insert(
    'INSERT INTO schedule_events (title, date, type, description) VALUES (?, ?, ?, ?)',
    [data.title, data.date, data.type || 'study', data.description || null]
  );
  return sqliteDB.get('SELECT * FROM schedule_events WHERE id = ?', [id]);
}

export async function updateScheduleEvent(id: number, data: {
  title?: string;
  date?: string;
  type?: string;
  description?: string;
}): Promise<any> {
  await sqliteDB.init();
  const updates: string[] = [];
  const params: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  });
  
  params.push(id);
  sqliteDB.run(`UPDATE schedule_events SET ${updates.join(', ')} WHERE id = ?`, params);
  return sqliteDB.get('SELECT * FROM schedule_events WHERE id = ?', [id]);
}

export async function deleteScheduleEvent(id: number): Promise<void> {
  await sqliteDB.init();
  sqliteDB.run('DELETE FROM schedule_events WHERE id = ?', [id]);
}

// Database management functions
export async function clearAllData(): Promise<void> {
  await sqliteDB.init();
  sqliteDB.clearAll();
}

export async function downloadDatabase(): Promise<void> {
  await sqliteDB.init();
  sqliteDB.downloadDatabase();
}

export async function uploadDatabase(file: File): Promise<void> {
  await sqliteDB.init();
  await sqliteDB.uploadDatabase(file);
}

// Backup functions with timestamp
export async function createBackup(): Promise<string> {
  await sqliteDB.init();
  sqliteDB.saveToLocalStorage();
  const timestamp = new Date().toISOString();
  const backupKey = `backup_${timestamp}`;
  const mainData = localStorage.getItem('neet_prep_app_db');
  if (mainData) {
    localStorage.setItem(backupKey, mainData);
  }
  return backupKey;
}

export async function getBackups(): Promise<string[]> {
  const backups = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('backup_')) {
      backups.push(key);
    }
  }
  return backups.sort().reverse();
}

export async function restoreBackup(backupKey: string): Promise<void> {
  const backupData = localStorage.getItem(backupKey);
  if (backupData) {
    localStorage.setItem('neet_prep_app_db', backupData);
    // Reinitialize database
    await sqliteDB.init();
  }
}