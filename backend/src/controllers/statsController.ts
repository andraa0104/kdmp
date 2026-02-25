import { Request, Response } from 'express';
import pool from '../config/database';

// Get summary statistics for anggota
export const getAnggotaSummary = async (req: Request, res: Response) => {
  try {
    // Get total members
    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM anggota'
    );
    const total = parseInt(totalResult.rows[0].total);

    // Get active members
    const activeResult = await pool.query(
      "SELECT COUNT(*) as count FROM anggota WHERE status = 'Aktif'"
    );
    const aktif = parseInt(activeResult.rows[0].count);

    // Get non-active members
    const nonAktif = total - aktif;

    // Get breakdown by jenis_warga
    const breakdownResult = await pool.query(
      "SELECT jenis_warga, COUNT(*) as count FROM anggota GROUP BY jenis_warga"
    );
    
    const breakdown = {
      warga_desa: 0,
      warga_luar: 0
    };
    
    breakdownResult.rows.forEach(row => {
      if (row.jenis_warga === 'warga_desa') {
        breakdown.warga_desa = parseInt(row.count);
      } else if (row.jenis_warga === 'warga_luar') {
        breakdown.warga_luar = parseInt(row.count);
      }
    });

    res.json({
      total,
      aktif,
      nonAktif,
      breakdown
    });
  } catch (error) {
    console.error('Error getting anggota summary:', error);
    res.status(500).json({ message: 'Error getting statistics' });
  }
};

// Get growth statistics for different time periods
export const getAnggotaGrowth = async (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFormat: string;
    let dateInterval: string;
    let limit: number;

    switch (period) {
      case 'week':
        dateFormat = 'IYYY-IW'; // ISO Week
        dateInterval = '1 week';
        limit = 12; // Last 12 weeks
        break;
      case 'quarter':
        dateFormat = 'YYYY-Q';
        dateInterval = '3 months';
        limit = 8; // Last 8 quarters (2 years)
        break;
      case 'semester':
        dateFormat = 'YYYY';
        dateInterval = '6 months';
        limit = 6; // Last 3 years (6 semesters)
        break;
      case 'year':
        dateFormat = 'YYYY';
        dateInterval = '1 year';
        limit = 5; // Last 5 years
        break;
      case 'month':
      default:
        dateFormat = 'YYYY-MM';
        dateInterval = '1 month';
        limit = 12; // Last 12 months
        break;
    }

    // Query to get growth data
    let query: string;
    
    if (period === 'semester') {
      // Custom handling for semester (2 per year)
      query = `
        WITH periods AS (
          SELECT 
            date_trunc('year', d) + (CASE WHEN EXTRACT(MONTH FROM d) <= 6 THEN 0 ELSE 6 END) * interval '1 month' as period_start
          FROM generate_series(
            NOW() - interval '3 years',
            NOW(),
            interval '1 month'
          ) d
        ),
        unique_periods AS (
          SELECT DISTINCT period_start FROM periods ORDER BY period_start DESC LIMIT ${limit}
        )
        SELECT 
          to_char(up.period_start, 'YYYY') || '-S' || 
          (CASE WHEN EXTRACT(MONTH FROM up.period_start) <= 6 THEN '1' ELSE '2' END) as period,
          COUNT(a.id) as count
        FROM unique_periods up
        LEFT JOIN anggota a ON a.created_at >= up.period_start 
          AND a.created_at < up.period_start + interval '6 months'
        GROUP BY up.period_start
        ORDER BY up.period_start ASC
      `;
    } else if (period === 'quarter') {
      query = `
        WITH periods AS (
          SELECT 
            date_trunc('quarter', generate_series(
              NOW() - interval '2 years',
              NOW(),
              interval '3 months'
            )) as period_start
        )
        SELECT 
          to_char(p.period_start, 'YYYY') || '-Q' || 
          EXTRACT(QUARTER FROM p.period_start) as period,
          COUNT(a.id) as count
        FROM periods p
        LEFT JOIN anggota a ON a.created_at >= p.period_start 
          AND a.created_at < p.period_start + interval '${dateInterval}'
        GROUP BY p.period_start
        ORDER BY p.period_start ASC
        LIMIT ${limit}
      `;
    } else {
      query = `
        WITH periods AS (
          SELECT 
            date_trunc('${period === 'week' ? 'week' : period === 'year' ? 'year' : 'month'}', generate_series(
              NOW() - interval '${limit} ${period === 'week' ? 'weeks' : period === 'year' ? 'years' : 'months'}',
              NOW(),
              interval '${dateInterval}'
            )) as period_start
        )
        SELECT 
          to_char(p.period_start, '${dateFormat}') as period,
          COUNT(a.id) as count
        FROM periods p
        LEFT JOIN anggota a ON a.created_at >= p.period_start 
          AND a.created_at < p.period_start + interval '${dateInterval}'
        GROUP BY p.period_start
        ORDER BY p.period_start ASC
      `;
    }

    const result = await pool.query(query);
    
    const growthData = result.rows.map(row => ({
      period: row.period,
      count: parseInt(row.count)
    }));

    res.json(growthData);
  } catch (error) {
    console.error('Error getting anggota growth:', error);
    res.status(500).json({ message: 'Error getting growth statistics' });
  }
};
