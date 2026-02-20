import { Request, Response } from 'express';
import pool from '../config/database';

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const parseId = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getAllDusun = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM dusun ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dusun' });
  }
};

export const getDusunById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid dusun id' });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM dusun WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Dusun not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dusun' });
  }
};

export const getDusunWithRT = async (req: Request, res: Response) => {
  try {
    const dusunResult = await pool.query('SELECT * FROM dusun ORDER BY id');
    const rtResult = await pool.query('SELECT * FROM rt ORDER BY dusun_id, nomor');
    
    const dusunWithRT = dusunResult.rows.map(dusun => ({
      ...dusun,
      rtList: rtResult.rows.filter(rt => rt.dusun_id === dusun.id)
    }));
    
    res.json(dusunWithRT);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

export const createDusun = async (req: Request, res: Response) => {
  const { nama, rtList } = req.body ?? {};
  if (!isNonEmptyString(nama)) {
    res.status(400).json({ error: 'Nama dusun is required' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dusunResult = await client.query(
      'INSERT INTO dusun (nama) VALUES ($1) RETURNING *',
      [nama]
    );
    
    const dusun = dusunResult.rows[0];
    
    if (Array.isArray(rtList) && rtList.length > 0) {
      for (const rt of rtList) {
        if (!isNonEmptyString(rt?.nomor)) {
          await client.query('ROLLBACK');
          res.status(400).json({ error: 'RT nomor is required' });
          return;
        }

        await client.query(
          'INSERT INTO rt (dusun_id, nomor) VALUES ($1, $2)',
          [dusun.id, rt.nomor]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(dusun);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create dusun' });
  } finally {
    client.release();
  }
};

export const updateDusun = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid dusun id' });
    return;
  }

  const { nama, rtList } = req.body ?? {};
  if (!isNonEmptyString(nama)) {
    res.status(400).json({ error: 'Nama dusun is required' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateResult = await client.query(
      'UPDATE dusun SET nama = $1 WHERE id = $2 RETURNING id',
      [nama, id]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Dusun not found' });
      return;
    }

    await client.query('DELETE FROM rt WHERE dusun_id = $1', [id]);

    if (Array.isArray(rtList) && rtList.length > 0) {
      for (const rt of rtList) {
        if (!isNonEmptyString(rt?.nomor)) {
          await client.query('ROLLBACK');
          res.status(400).json({ error: 'RT nomor is required' });
          return;
        }

        await client.query(
          'INSERT INTO rt (dusun_id, nomor) VALUES ($1, $2)',
          [id, rt.nomor]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Dusun updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update dusun' });
  } finally {
    client.release();
  }
};

export const deleteDusun = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid dusun id' });
    return;
  }

  try {
    const result = await pool.query('DELETE FROM dusun WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Dusun not found' });
      return;
    }

    res.json({ message: 'Dusun deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dusun' });
  }
};

export const getRTByDusun = async (req: Request, res: Response) => {
  const dusunId = parseId(req.params.dusunId);
  if (!dusunId) {
    res.status(400).json({ error: 'Invalid dusun id' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM rt WHERE dusun_id = $1 ORDER BY nomor',
      [dusunId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch RT' });
  }
};

export const createRT = async (req: Request, res: Response) => {
  const { dusun_id, nomor } = req.body ?? {};
  const parsedDusunId = Number.parseInt(String(dusun_id), 10);

  if (!Number.isInteger(parsedDusunId) || parsedDusunId <= 0) {
    res.status(400).json({ error: 'Dusun id is required' });
    return;
  }

  if (!isNonEmptyString(nomor)) {
    res.status(400).json({ error: 'Nomor RT is required' });
    return;
  }

  try {
    const result = await pool.query(
      'INSERT INTO rt (dusun_id, nomor) VALUES ($1, $2) RETURNING *',
      [parsedDusunId, nomor]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create RT' });
  }
};

export const updateRT = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid RT id' });
    return;
  }

  const { nomor } = req.body ?? {};
  if (!isNonEmptyString(nomor)) {
    res.status(400).json({ error: 'Nomor RT is required' });
    return;
  }

  try {
    const result = await pool.query(
      'UPDATE rt SET nomor = $1 WHERE id = $2 RETURNING *',
      [nomor, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'RT not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update RT' });
  }
};

export const deleteRT = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid RT id' });
    return;
  }

  try {
    const result = await pool.query('DELETE FROM rt WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'RT not found' });
      return;
    }

    res.json({ message: 'RT deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete RT' });
  }
};
