import { toast } from "react-toastify";

export const notifySuccess = (msg) => toast.success(msg);
export const notifyInfo = (msg) => toast.info(msg);
export const notifyError = (msg) => toast.error(msg); 