"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const AdminPermissionControllers_1 = __importDefault(require("../controllers/AdminPermissionControllers"));
const router = express_1.default.Router();
router.get('/', AdminPermissionControllers_1.default.readAll);
router.get('/:adminPermissionId', AdminPermissionControllers_1.default.readAdminPermission);
router.post('/', AdminPermissionControllers_1.default.createAdminPermission);
router.put('/:adminPermissionId', AdminPermissionControllers_1.default.updateAdminPermission);
router.delete('/:adminPermissionId', AdminPermissionControllers_1.default.deleteAdminPermission);
module.exports = router;
