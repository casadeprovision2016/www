import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export const getAllVisitors = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('visitors')
      .select('*');

    if (error) {
      logger.error('Error fetching visitors:', error);
      return res.status(500).json({ error: 'Failed to fetch visitors' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Exception fetching visitors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createVisitor = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('visitors')
      .insert([req.body])
      .select();

    if (error) {
      logger.error('Error creating visitor:', error);
      return res.status(500).json({ error: 'Failed to create visitor' });
    }

    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    logger.error('Exception creating visitor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateVisitor = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('visitors')
      .update(req.body)
      .eq('id', id)
      .select();

    if (error) {
      logger.error('Error updating visitor:', error);
      return res.status(500).json({ error: 'Failed to update visitor' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.status(200).json({ success: true, data: data[0] });
  } catch (error) {
    logger.error('Exception updating visitor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteVisitor = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('visitors')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting visitor:', error);
      return res.status(500).json({ error: 'Failed to delete visitor' });
    }

    res.status(204).send(); // No content
  } catch (error) {
    logger.error('Exception deleting visitor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
