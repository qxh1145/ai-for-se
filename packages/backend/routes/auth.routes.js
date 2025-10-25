import express from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import jwt from "jsonwebtoken";

import { sendOtp, verifyOtp } from "../controllers/emailVerify.controller.js";
import {
  register,
  login,
  me,
  checkUsername,
  checkEmail,
  checkPhone,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,           
} from "../controllers/auth.controller.js";
import authGuard from "../middleware/auth.guard.js";
import { registerValidation, loginValidation } from "../middleware/auth.validation.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many login attempts, try again later." },
});

const forgotLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP requests, try again later." },
});

router.post("/register", registerValidation, register);
router.post("/login", loginLimiter, loginValidation, login);
router.get("/me", authGuard, me);
router.get("/check-username", checkUsername);
router.get("/check-email", checkEmail);
router.get("/check-phone", checkPhone);
router.post("/refresh", refreshToken);

router.post("/logout", authGuard, logout);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false,
  }),
  async (req, res) => {
    if (!req.user) return res.redirect(`${process.env.FRONTEND_URL}/login`);

    const oauthUser = req.user;
    if (oauthUser && typeof oauthUser.save === "function") {
      oauthUser.lastLoginAt = new Date();
      oauthUser.save({ fields: ["lastLoginAt"] }).catch(() => {});
    }

    const userId = oauthUser.id ?? oauthUser.user_id ?? oauthUser._id;
    const accessToken = jwt.sign(
      { sub: userId, role: oauthUser.role, type: "access" },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    const isNew = oauthUser?.get?.("isNew") ? 1 : 0;
    const safeUser = (() => {
      try {
        const { passwordHash, providerId, ...rest } = oauthUser.toJSON();
        return rest;
      } catch {
        return {};
      }
    })();

    let targetOrigin = "*";
    try {
      targetOrigin = new URL(process.env.FRONTEND_URL).origin;
    } catch {
      targetOrigin = "*";
    }

    const safe = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");
    res.type("html").send(`<!doctype html>
<html><head><meta charset="utf-8"/></head><body>
<script>
  (function() {
    try {
      var payload = {
        source: "oauth",
        provider: "google",
        status: "success",
        token: ${safe(accessToken)},
        isNew: ${safe(isNew)},
        user: ${safe(safeUser)}
      };
      if (window.opener && typeof window.opener.postMessage === "function") {
        window.opener.postMessage(payload, ${JSON.stringify(targetOrigin)});
      }
    } catch (e) {} finally {
      window.close();
      setTimeout(function(){
        try { window.location.replace(${JSON.stringify(process.env.FRONTEND_URL)}); } catch(_) {}
      }, 300);
    }
  })();
</script>
OK
</body></html>`);
  }
);

router.get("/logout-session", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect(process.env.FRONTEND_URL);
  });
});

router.post("/forgot-password", forgotLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", verifyOtp);

export default router;
