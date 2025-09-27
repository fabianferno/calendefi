import sqlite3 from "sqlite3";
import { promisify } from "util";

export interface CalendarConfig {
  id: string;
  calendarId: string;
  summary: string;
  walletAddress: string;
  lastBalance: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class DatabaseService {
  private db: sqlite3.Database;
  private run: (sql: string, params?: any[]) => Promise<sqlite3.RunResult>;
  private get: (sql: string, params?: any[]) => Promise<any>;
  private all: (sql: string, params?: any[]) => Promise<any[]>;

  constructor(dbPath: string = "./calendar_agent.db") {
    this.db = new sqlite3.Database(dbPath);

    // Promisify database methods
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
  }

  async initialize(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await this.run(`
        CREATE TABLE IF NOT EXISTS calendar_configs (
          id TEXT PRIMARY KEY,
          calendar_id TEXT UNIQUE NOT NULL,
          summary TEXT NOT NULL,
          wallet_address TEXT NOT NULL,
          last_balance TEXT DEFAULT '0',
          is_active BOOLEAN DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      // console.log("✅ Database initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize database:", error);
      throw error;
    }
  }

  async addCalendar(
    config: Omit<CalendarConfig, "id" | "createdAt" | "updatedAt">
  ): Promise<CalendarConfig> {
    try {
      const id = `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await this.run(
        `INSERT INTO calendar_configs (id, calendar_id, summary, wallet_address, last_balance, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          config.calendarId,
          config.summary,
          config.walletAddress,
          config.lastBalance,
          config.isActive ? 1 : 0,
          now,
          now,
        ]
      );

      return {
        id,
        ...config,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("Error adding calendar:", error);
      throw error;
    }
  }

  async getCalendar(calendarId: string): Promise<CalendarConfig | null> {
    try {
      const result = await this.get(
        "SELECT * FROM calendar_configs WHERE calendar_id = ?",
        [calendarId]
      );

      if (!result) return null;

      return {
        id: result.id,
        calendarId: result.calendar_id,
        summary: result.summary,
        walletAddress: result.wallet_address,
        lastBalance: result.last_balance,
        isActive: Boolean(result.is_active),
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    } catch (error) {
      console.error("Error getting calendar:", error);
      throw error;
    }
  }

  async getAllCalendars(): Promise<CalendarConfig[]> {
    try {
      const results = await this.all(
        "SELECT * FROM calendar_configs ORDER BY created_at DESC"
      );

      return results.map((result) => ({
        id: result.id,
        calendarId: result.calendar_id,
        summary: result.summary,
        walletAddress: result.wallet_address,
        lastBalance: result.last_balance,
        isActive: Boolean(result.is_active),
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      }));
    } catch (error) {
      console.error("Error getting all calendars:", error);
      throw error;
    }
  }

  async getActiveCalendar(): Promise<CalendarConfig | null> {
    try {
      const result = await this.get(
        "SELECT * FROM calendar_configs WHERE is_active = 1 LIMIT 1"
      );

      if (!result) return null;

      return {
        id: result.id,
        calendarId: result.calendar_id,
        summary: result.summary,
        walletAddress: result.wallet_address,
        lastBalance: result.last_balance,
        isActive: Boolean(result.is_active),
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    } catch (error) {
      console.error("Error getting active calendar:", error);
      throw error;
    }
  }

  async setActiveCalendar(calendarId: string): Promise<void> {
    try {
      // First, deactivate all calendars
      await this.run(
        "UPDATE calendar_configs SET is_active = 0, updated_at = ?",
        [new Date().toISOString()]
      );

      // Then activate the specified calendar
      await this.run(
        "UPDATE calendar_configs SET is_active = 1, updated_at = ? WHERE calendar_id = ?",
        [new Date().toISOString(), calendarId]
      );

      console.log(`✅ Set active calendar: ${calendarId}`);
    } catch (error) {
      console.error("Error setting active calendar:", error);
      throw error;
    }
  }

  async updateBalance(calendarId: string, balance: string): Promise<void> {
    try {
      await this.run(
        "UPDATE calendar_configs SET last_balance = ?, updated_at = ? WHERE calendar_id = ?",
        [balance, new Date().toISOString(), calendarId]
      );
    } catch (error) {
      console.error("Error updating balance:", error);
      throw error;
    }
  }

  async removeCalendar(calendarId: string): Promise<void> {
    try {
      await this.run("DELETE FROM calendar_configs WHERE calendar_id = ?", [
        calendarId,
      ]);
      console.log(`✅ Removed calendar: ${calendarId}`);
    } catch (error) {
      console.error("Error removing calendar:", error);
      throw error;
    }
  }

  close(): void {
    this.db.close();
  }
}

export default DatabaseService;
