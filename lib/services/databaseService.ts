import mysql from 'mysql2/promise';
import pool from '@/lib/db';

export const databaseService = {
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    let connection;
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.execute(sql, params);
      return rows as T;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  async transaction<T>(callback: (connection: mysql.Connection) => Promise<T>): Promise<T> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async testConnection() {
    let connection;
    try {
      connection = await pool.getConnection();
      const [result] = await connection.query<mysql.RowDataPacket[]>('SELECT NOW() as current_time, VERSION() as mysql_version');
      return {
        success: true,
        data: result[0]
      };
    } catch (error) {
      console.error('Database connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
}; 