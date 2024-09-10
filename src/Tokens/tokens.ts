import { Request, Response, NextFunction } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { sendError } from "../index";
require("dotenv").config();

export class Tokens {
  private accessTokenGenerate = process.env.JWT_ACCESS;
  private refreshTokenGenerate = process.env.JWT_REFRESH;
  //создание кроткосрочного токена
  public createAccessToken = (payload: { id: number }) => {
    return jwt.sign(payload, this.accessTokenGenerate, { expiresIn: "15m" });
  };
  //создание долгострочного токена
  public createRefreshToken = (payload: { id: number }) => {
    return jwt.sign(payload, this.refreshTokenGenerate, { expiresIn: "7d" });
  };
  private verifyAccessToken = (token: string): number | null => {
    try {
      const decoded = jwt.verify(token, this.accessTokenGenerate) as {
        id: number;
      };
      return decoded.id;
    } catch (e) {
      return null;
    }
  };
  //верификаця долгострочного токена
  private verifyRefreshToken = (token: string): number | null => {
    try {
      const decoded = jwt.verify(token, this.refreshTokenGenerate) as {
        id: number;
      };
      return decoded.id;
    } catch (e) {
      return null;
    }
  };
  //верификаця быстрого токена
  public checkAccessToken = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken)
      return sendError(res, {
        code: StatusCodes.UNAUTHORIZED,
        error: ReasonPhrases.UNAUTHORIZED,
        message: "session undefined",
      });
    const accessVerify: number | null = this.verifyAccessToken(accessToken);
    if (accessVerify === null)
      return sendError(res, {
        code: StatusCodes.UNAUTHORIZED,
        error: ReasonPhrases.UNAUTHORIZED,
        message: "session has expired",
      });
    (req as any).access = accessVerify;
    next();
  };
  //обновление быстрого токена
  public updateAccessToken = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const refreshToken = req.headers.authorization?.split(" ")[1];
    if (!refreshToken)
      return sendError(res, {
        code: StatusCodes.UNAUTHORIZED,
        error: ReasonPhrases.UNAUTHORIZED,
        message: "session undefined",
      });
    const refreshVerify: number | null = this.verifyRefreshToken(refreshToken);
    if (typeof refreshVerify !== "number")
      return sendError(res, {
        code: StatusCodes.UNAUTHORIZED,
        error: ReasonPhrases.UNAUTHORIZED,
        message: "session has expired",
      });
    const access = this.createAccessToken({ id: refreshVerify });
    return res.status(StatusCodes.CREATED).json({ access: access });
  };
}
