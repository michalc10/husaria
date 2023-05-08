import { Schema, model, Document } from "mongoose";

export interface IUserPermission {
    userId: string,
    username: string,
    canComments: boolean,
    canRate: boolean,
    canShowBooks: boolean
}

export interface IUserPermissionModel extends IUserPermission, Document { }

const userPermissionSchema = new Schema(
    {
        userId: { type: String, required: true, default: "-1" },
        username: { type: String, required: [true, "Please entere a username"] },
        canComments: { type: Boolean, required: true, default: true },
        canRate: { type: Boolean, required: true, default: true },
        canShowBooks: { type: Boolean, required: true, default: true }
    },
    {
        timestamps: true
    }
)

export default model<IUserPermissionModel>('UserPermission', userPermissionSchema);

