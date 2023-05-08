"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.storage = void 0;
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
exports.storage = multer_1.default.diskStorage({
    destination: (request, file, callback) => {
        callback(null, './src/public/images');
    },
    filename: (request, file, callback) => {
        let ext = path_1.default.extname(file.originalname);
        callback(null, Date.now() + ext);
    }
});
exports.upload = (0, multer_1.default)({
    storage: exports.storage,
    fileFilter(request, file, callback) {
        if (file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/jpeg') {
            callback(null, true);
        }
        else {
            callback(null, false);
        }
    }
});
