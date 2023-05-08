"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const adminPermissionSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, default: "-1" },
    username: { type: String, required: [true, "Please entere a username"] },
    canAdd: { type: Boolean, required: true, default: true },
    canChange: { type: Boolean, required: true, default: true },
    canDelete: { type: Boolean, required: true, default: true },
    canShowBooks: { type: Boolean, required: true, default: true }
}, {
    timestamps: true
});
exports.default = (0, mongoose_1.model)('AdminPermission', adminPermissionSchema);
