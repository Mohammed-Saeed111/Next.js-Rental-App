import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rental-app-secret-2024";

// POST /auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      res.status(400).json({ message: "Email, password and role are required" });
      return;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: { email, password: hashed, role },
    });

    // Create token
    const token = jwt.sign(
      { sub: user.id, "custom:role": user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { sub: user.id, "custom:role": user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /auth/me
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No token" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
