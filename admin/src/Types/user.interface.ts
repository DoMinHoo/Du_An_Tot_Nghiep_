import type { Role } from "./role.interface";

export interface User {
    _id: string;
    name: string;
    email: string;
    address: string;
    dateBirth: string;
    status: string;
    roleId: Role; // Backend trả về object Role đã populate
    gender: string;
    phone: string;
}