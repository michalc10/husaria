import { Request, Response } from 'express';
import { competitionTemplateRepository } from '../repositories/competitionTemplateRepository';
import { notFound, serverError } from './helpers';

const readAll = async (_req: Request, res: Response) => {
  try {
    const templates = await competitionTemplateRepository.findAll();
    return res.status(200).json(templates);
  } catch (error) {
    return serverError(res, error);
  }
};

const readTemplate = async (req: Request, res: Response) => {
  try {
    const template = await competitionTemplateRepository.findById(req.params.templateId);
    return template ? res.status(200).json(template) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const createTemplate = async (req: Request, res: Response) => {
  try {
    const template = await competitionTemplateRepository.create(req.body);
    return res.status(201).json(template);
  } catch (error) {
    return serverError(res, error);
  }
};

const updateTemplate = async (req: Request, res: Response) => {
  try {
    const template = await competitionTemplateRepository.update(req.params.templateId, req.body);
    return template ? res.status(200).json(template) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const template = await competitionTemplateRepository.delete(req.params.templateId);
    return template ? res.status(200).json({ message: 'usunięto' }) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

export default { readAll, readTemplate, createTemplate, updateTemplate, deleteTemplate };
