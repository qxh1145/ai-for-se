// packages/backend/controllers/admin.controller.js
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "../models/user.model.js";
import PasswordReset from "../models/passwordReset.model.js";
import {
  sendMail,
  lockEmailTemplate,
  unlockEmailTemplate,
} from "../utils/mailer.js";

/**
 * POST /api/admin/users/:id/lock
 * Body: { reason }
 */
export async function lockUser(req, res) {
  try {
    const userId = req.params.id;
    const { reason } = req.body || {};

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isLocked) {
      return res.json({
        success: true,
        message: "User already locked",
        data: { user: safeUser(user) },
      });
    }

    await user.update({
      isLocked: true,
      lockedAt: new Date(),
      lockReason: reason || null,
    });

    // gửi email khi bị khóa (không chặn response nếu lỗi)
    if (user.email) {
      const tpl = lockEmailTemplate({
        fullName: user.fullName,
        reason: reason,
      });
      sendMail({ to: user.email, ...tpl }).catch((e) =>
        console.warn("lock mail error:", e?.message)
      );
    }

    return res.json({
      success: true,
      message: "User locked successfully",
      data: { user: safeUser(user) },
    });
  } catch (err) {
    console.error("Admin lockUser error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * PATCH /api/admin/users/:id/unlock
 */
export async function unlockUser(req, res) {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isLocked) {
      return res.json({
        success: true,
        message: "User already unlocked",
        data: { user: safeUser(user) },
      });
    }

    await user.update({ isLocked: false, lockedAt: null, lockReason: null });

    // gửi email khi mở khóa (không chặn response nếu lỗi)
    if (user.email) {
      const tpl = unlockEmailTemplate({ fullName: user.fullName });
      sendMail({ to: user.email, ...tpl }).catch((e) =>
        console.warn("unlock mail error:", e?.message)
      );
    }

    return res.json({
      success: true,
      message: "User unlocked successfully",
      data: { user: safeUser(user) },
    });
  } catch (err) {
    console.error("Admin unlockUser error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/admin/users
 * Query: limit, offset, search, plan(FREE|PREMIUM), role(USER|TRAINER|ADMIN)
 * Trả về trạng thái hiển thị theo hoạt động gần nhất:
 * - ACTIVE: lastActiveAt trong cửa sổ ACTIVE_WINDOW_MS (mặc định 5 phút)
 * - INACTIVE: ngược lại

 */
export async function listUsers(req, res) {
  try {
    const limitRaw = parseInt(req.query.limit ?? "50", 10);
    const offsetRaw = parseInt(req.query.offset ?? "0", 10);
    const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 50 : limitRaw), 200);
    const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

    const search = String(req.query.search ?? "").trim();
    const planRaw = String(req.query.plan ?? "").trim().toUpperCase();
    const roleRaw = String(req.query.role ?? "").trim().toUpperCase();

    const where = {};
    const iLikeOp =
      typeof sequelize?.getDialect === "function" &&
      sequelize.getDialect() === "postgres"
        ? Op.iLike
        : Op.like;

    if (search) {
      where[Op.or] = [
        { username: { [iLikeOp]: `%${search}%` } },
        { email: { [iLikeOp]: `%${search}%` } },
      ];
    }
    if (["FREE", "PREMIUM"].includes(planRaw)) where.plan = planRaw;
    if (["USER", "TRAINER", "ADMIN"].includes(roleRaw)) where.role = roleRaw;

    const { rows, count } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      attributes: [
        "user_id",
        "username",
        "email",
        "role",
        "plan",
        "status",        // trạng thái DB (không dùng để hiển thị)
        "lastLoginAt",
        "lastActiveAt",  // dùng tính trạng thái hiển thị
        "isLocked",
        "lockReason",
        "lockedAt",
        "created_at",
        "updated_at",
      ],
    });

    const ACTIVE_WINDOW_MS = Number(process.env.ACTIVE_WINDOW_MS || 5 * 60 * 1000);
    const now = Date.now();

    const items = rows.map((u) => {
      const json = u.toJSON();
      const lastActiveTs = json.lastActiveAt ? new Date(json.lastActiveAt).getTime() : 0;
      const activityStatus =
        lastActiveTs && (now - lastActiveTs) < ACTIVE_WINDOW_MS ? "ACTIVE" : "INACTIVE";

      return {
        user_id: json.user_id,
        username: json.username,
        email: json.email,
        role: json.role,
        plan: json.plan,
        status: activityStatus,      // dùng cho cột STATUS bên FE
        lastLoginAt: json.lastLoginAt,
        lastActiveAt: json.lastActiveAt,
        isLocked: json.isLocked,
        lockReason: json.lockReason,
        lockedAt: json.lockedAt,
        created_at: json.created_at,
        updated_at: json.updated_at,
      };
    });

    return res.json({
      success: true,
      data: { items, total: count, limit, offset },
    });
  } catch (err) {
    console.error("Admin listUsers error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}


export async function updateUserRole(req, res) {
  try {
    const userId = req.params.id;
    const nextRole = String(req.body.role ?? "").trim().toUpperCase();

    if (!["USER", "TRAINER", "ADMIN"].includes(nextRole)) {
      return res.status(422).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.role = nextRole;
    await user.save({ fields: ["role"] });

    return res.json({
      success: true,
      message: "Role updated",
      data: { user: safeUser(user) },
    });
  } catch (err) {
    console.error("Admin updateUserRole error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}


export async function updateUserPlan(req, res) {
  try {
    const userId = req.params.id;
    const nextPlan = String(req.body.plan ?? "").trim().toUpperCase();

    if (!["FREE", "PREMIUM"].includes(nextPlan)) {
      return res.status(422).json({ success: false, message: "Invalid plan" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.plan = nextPlan;
    await user.save({ fields: ["plan"] });

    return res.json({
      success: true,
      message: "Plan updated",
      data: { user: safeUser(user) },
    });
  } catch (err) {
    console.error("Admin updateUserPlan error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}


export async function resetPassword(req, res) {
  try {
    const { userId } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "newPassword & confirmPassword are required",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const strong =
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[\W_]/.test(newPassword);

    if (!strong) {
      return res.status(400).json({
        success: false,
        message:
          "Password too weak (min 8, cần chữ hoa, chữ thường, số, ký tự đặc biệt)",

      });
    }

    const result = await sequelize.transaction(async (t) => {
      const user = await User.findOne({
        where: { user_id: Number(userId) },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!user) return { ok: false, message: "User not found" };

      user.set("passwordHash", newPassword);
      user.changed("passwordHash", true);
      await user.save({ transaction: t });

      await PasswordReset.create(
        {
          user_id: Number(userId),
          token_hash: "ADMIN_RESET",
          expires_at: sequelize.fn("NOW"),
          used_at: sequelize.fn("NOW"),
          created_at: sequelize.fn("NOW"),

        },
        { transaction: t }
      );

      return { ok: true };
    });

    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error("Admin resetPassword error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Helper: chỉ lấy field an toàn để trả về
 */
function safeUser(user) {
  return {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    role: user.role,
    plan: user.plan,
    status: user.status,           // status ở DB (không dùng để hiển thị ACTIVE/INACTIVE)
    lastLoginAt: user.lastLoginAt,
    lastActiveAt: user.lastActiveAt,
    isLocked: user.isLocked,
    lockReason: user.lockReason,
    lockedAt: user.lockedAt,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}
