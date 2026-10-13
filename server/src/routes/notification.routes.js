import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { 
    getNotifications, 
    getUnreadCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
} from "../controllers/notification.controller.js";

const router = Router();

router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);

router.patch("/read-all", markAllNotificationsAsRead);
router.patch("/:id/read", markNotificationAsRead);

export default router;