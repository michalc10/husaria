import path from 'path'
import { Request } from 'express'
import multer, { FileFilterCallback } from 'multer'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

export const storage = multer.diskStorage({
    destination: (
        request: Request,
        file: Express.Multer.File,
        callback: DestinationCallback
    ): void => {
        callback(null, './src/public/images')
    },

    filename: (
        request: Request,
        file: Express.Multer.File,
        callback: FileNameCallback
    ): void => {
        let ext = path.extname(file.originalname)
        callback(null, Date.now() + ext)
    }
})


export const upload = multer({
    storage: storage,
    fileFilter  (
        request: Request,
        file: Express.Multer.File,
        callback: FileFilterCallback
    ): void  {
        if (
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/jpeg'
        ) {
            callback(null, true)
        } else {
            callback(null, false)
        }
    }
})
