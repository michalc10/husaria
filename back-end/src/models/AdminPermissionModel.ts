import { Schema, model } from "mongoose";

export interface IAdminPermission {
    userId: string,
    username: string,
    canAdd: boolean,
    canChange: boolean,
    canDelete: boolean,
    canShowBooks: boolean
}

export interface IAdminPermissionModel extends IAdminPermission, Document { }

const adminPermissionSchema = new Schema(
    {
        userId: { type: String, required: true, default: "-1" },
        username: { type: String, required: [true, "Please entere a username"] },
        canAdd: { type: Boolean, required: true, default: true },
        canChange: { type: Boolean, required: true, default: true },
        canDelete: { type: Boolean, required: true, default: true },
        canShowBooks: { type: Boolean, required: true, default: true }
    },
    {
        timestamps: true
    }
)

export default model<IAdminPermissionModel>('AdminPermission', adminPermissionSchema);