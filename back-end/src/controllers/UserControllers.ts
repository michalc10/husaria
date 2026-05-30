import { Request, Response } from 'express';
import userRepository from '../repositories/userRepository';
import { notFound, serverError } from './helpers';

const readAll = async (_req: Request, res: Response) => {
  try {
    const users = await userRepository.readAll();
    return res.status(200).json(users);
  } catch (error) {
    return serverError(res, error);
  }
};

const readUser = async (req: Request, res: Response) => {
  try {
    const user = await userRepository.read(req.params.userId);
    return user ? res.status(200).json(user) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userRepository.create(req.body);
    return res.status(201).json(user);
  } catch (error) {
    return serverError(res, error);
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await userRepository.update(req.params.userId, req.body);
    return user ? res.status(200).json(user) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const resetPassword = async (req: Request, res: Response) => {
  try {
    const user = await userRepository.resetPassword(req.params.userId, req.body.temporaryPassword);
    return user ? res.status(200).json(user) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const deactivate = async (req: Request, res: Response) => {
  try {
    const user = await userRepository.setActive(req.params.userId, false);
    return user ? res.status(200).json(user) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const activate = async (req: Request, res: Response) => {
  try {
    const user = await userRepository.setActive(req.params.userId, true);
    return user ? res.status(200).json(user) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

export default {
  readAll,
  readUser,
  createUser,
  updateUser,
  resetPassword,
  deactivate,
  activate
};
