import { Request, Response } from 'express';
import { bannerRepository } from '../repositories/bannerRepository';
import { notFound, serverError } from './helpers';

const createBanner = async (req: Request, res: Response) => {
  try {
    const banner = await bannerRepository.create(req.body);
    return res.status(201).json(banner);
  } catch (error) {
    return serverError(res, error);
  }
};

const readBanner = async (req: Request, res: Response) => {
  try {
    const banner = await bannerRepository.findById(req.params.bannerId);
    return banner ? res.status(200).json(banner) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const readAll = async (req: Request, res: Response) => {
  try {
    const banners = await bannerRepository.findAll();
    return res.status(200).json(banners);
  } catch (error) {
    return serverError(res, error);
  }
};

const updateBanner = async (req: Request, res: Response) => {
  try {
    const banner = await bannerRepository.update(req.params.bannerId, req.body);
    return banner ? res.status(200).json(banner) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const deleteBanner = async (req: Request, res: Response) => {
  try {
    const banner = await bannerRepository.delete(req.params.bannerId);
    return banner ? res.status(200).json({ message: 'usunięto' }) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

export default { createBanner, readAll, readBanner, updateBanner, deleteBanner };
