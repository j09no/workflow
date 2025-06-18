import initSqlJs, { Database } from 'sql.js';

// SQL.js Database Manager with persistent storage
class SQLiteManager {
  private db: Database | null = null;
  private sqlJs: any = null;
  private dbName = 'neet_prep_app_db';
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing SQL.js...');
      
      // Initialize SQL.js
      this.sqlJs = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      // Try to load existing database from localStorage
      const savedDb = localStorage.getItem(this.dbName);
      
      if (savedDb) {
        console.log('Loading existing database from localStorage...');
        const binaryString = atob(savedDb);
      const binaryArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        binaryArray[i] = binaryString.charCodeAt(i);
      }
        this.db = new this.sqlJs.Database(binaryArray);
      } else {
        console.log('Creating new database...');
        this.db = new this.sqlJs.Database();
        await this.createTables();
      }

      this.isInitialized = true;
      console.log('SQL.js database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQL.js database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTableQueries = [
      // Messages table
      `CREATE TABLE messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        sender TEXT NOT NULL
      )`,

      // Files table
      `CREATE TABLE files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        size TEXT,
        path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Folders table
      `CREATE TABLE folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Subjects table
      `CREATE TABLE subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT NOT NULL
      )`,

      // Chapters table
      `CREATE TABLE chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        progress INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        difficulty TEXT,
        FOREIGN KEY (subject_id) REFERENCES subjects (id)
      )`,

      // Questions table
      `CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chapter_id INTEGER,
        question TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_answer INTEGER NOT NULL,
        explanation TEXT,
        difficulty TEXT DEFAULT 'medium',
        FOREIGN KEY (chapter_id) REFERENCES chapters (id)
      )`,

      // Quiz sessions table
      `CREATE TABLE quiz_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chapter_id INTEGER,
        total_questions INTEGER NOT NULL,
        current_question INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chapter_id) REFERENCES chapters (id)
      )`,

      // Quiz answers table
      `CREATE TABLE quiz_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        question_id INTEGER,
        selected_answer INTEGER NOT NULL,
        is_correct BOOLEAN NOT NULL,
        FOREIGN KEY (session_id) REFERENCES quiz_sessions (id),
        FOREIGN KEY (question_id) REFERENCES questions (id)
      )`,

      // Quiz stats table
      `CREATE TABLE quiz_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        chapter_title TEXT NOT NULL,
        subtopic_title TEXT,
        subject_title TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        percentage REAL NOT NULL
      )`,

      // Study sessions table
      `CREATE TABLE study_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chapter_id INTEGER,
        duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chapter_id) REFERENCES chapters (id)
      )`,

      // Schedule events table
      `CREATE TABLE schedule_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date DATETIME NOT NULL,
        type TEXT DEFAULT 'study',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of createTableQueries) {
      try {
        this.db.run(query);
        console.log('Table created successfully');
      } catch (error) {
        console.error('Error creating table:', error);
      }
    }

    // Insert default data
    await this.insertDefaultData();
  }

  private async insertDefaultData(): Promise<void> {
    if (!this.db) return;

    try {
      // Default subjects
      const defaultSubjects = [
        { name: 'Physics', color: 'blue' },
        { name: 'Chemistry', color: 'green' },
        { name: 'Biology', color: 'purple' }
      ];

      for (const subject of defaultSubjects) {
        this.db.run(
          'INSERT INTO subjects (name, color) VALUES (?, ?)',
          [subject.name, subject.color]
        );
      }

      // Default chapters
      const defaultChapters = [
        { subject_id: 1, title: 'Mechanics', description: 'Study of motion and forces', difficulty: 'medium', total_questions: 50 },
        { subject_id: 1, title: 'Thermodynamics', description: 'Heat and energy transfer', difficulty: 'hard', total_questions: 40 },
        { subject_id: 2, title: 'Organic Chemistry', description: 'Carbon compounds and reactions', difficulty: 'medium', total_questions: 60 },
        { subject_id: 3, title: 'Cell Biology', description: 'Structure and function of cells', difficulty: 'easy', total_questions: 45 }
      ];

      for (const chapter of defaultChapters) {
        this.db.run(
          'INSERT INTO chapters (subject_id, title, description, difficulty, total_questions) VALUES (?, ?, ?, ?, ?)',
          [chapter.subject_id, chapter.title, chapter.description, chapter.difficulty, chapter.total_questions]
        );
      }

      console.log('Default data inserted successfully');
    } catch (error) {
      console.error('Error inserting default data:', error);
    }
  }

  // Save database to localStorage
  saveToLocalStorage(): void {
    if (!this.db) return;

    try {
      const binaryArray = this.db.export();
      const base64 = btoa(String.fromCharCode.apply(null, Array.from(binaryArray)));
      localStorage.setItem(this.dbName, base64);
      console.log('Database saved to localStorage');
    } catch (error) {
      console.error('Error saving database to localStorage:', error);
    }
  }

  // Auto-save after every operation
  private autoSave(): void {
    this.saveToLocalStorage();
  }

  // Download database file
  downloadDatabase(): void {
    if (!this.db) return;

    try {
      const binaryArray = this.db.export();
      const blob = new Blob([binaryArray], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${this.dbName}_backup_${new Date().toISOString().split('T')[0]}.db`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (error) {
      console.error('Error downloading database:', error);
    }
  }

  // Upload/restore database file
  async uploadDatabase(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      this.db = new this.sqlJs.Database(uint8Array);
      this.autoSave();
      console.log('Database restored from file');
    } catch (error) {
      console.error('Error uploading database:', error);
      throw error;
    }
  }

  // Generic query execution
  run(sql: string, params: any[] = []): any {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = this.db.run(sql, params);
      this.autoSave();
      return result;
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  }

  // Get single row
  get(sql: string, params: any[] = []): any {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const result = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return result;
    } catch (error) {
      console.error('SQL get error:', error);
      throw error;
    }
  }

  // Get all rows
  all(sql: string, params: any[] = []): any[] {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } catch (error) {
      console.error('SQL all error:', error);
      throw error;
    }
  }

  // Insert and return last insert row id
  insert(sql: string, params: any[] = []): number {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      this.db.run(sql, params);
      const result = this.db.exec('SELECT last_insert_rowid() as id')[0];
      const id = result?.values[0][0] as number;
      this.autoSave();
      return id;
    } catch (error) {
      console.error('SQL insert error:', error);
      throw error;
    }
  }

  // Clear all data (reset database)
  clearAll(): void {
    if (!this.db) return;

    try {
      const tables = ['messages', 'files', 'folders', 'quiz_answers', 'quiz_sessions', 
                     'quiz_stats', 'study_sessions', 'schedule_events', 'questions', 
                     'chapters', 'subjects'];
      
      for (const table of tables) {
        this.db.run(`DELETE FROM ${table}`);
      }
      
      this.autoSave();
      console.log('All data cleared from database');
    } catch (error) {
      console.error('Error clearing database:', error);
    }
  }
}

// Create singleton instance
export const sqliteDB = new SQLiteManager();

// Initialize on module load
if (typeof window !== 'undefined') {
  sqliteDB.init().catch(console.error);
}