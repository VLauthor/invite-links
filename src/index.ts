import express, { Application, Response, Request, NextFunction } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import multer from "multer";
import path from "path";
require("dotenv").config();
import Data from "./Data/data";
import { loginSchema, paySchema, registerSchema } from "./Data/request";
import { Tokens } from "./Tokens/tokens";
import { Random } from "./Random/random";
import { User, Video } from "./Interface/user";
import { access } from "fs";
const app: Application = express();
const upload = multer();
const tokens = new Tokens();
const port = process.env.PORT || 3000;
const db = new Data();
app.use("/", express.static(path.join(__dirname, "..", "public")));

//регистрация фронтенд переадрисация
app.get("/link/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "link", "index.html"));
});

//обработка регистрации
app.post(
  "/api/registration",
  upload.fields([
    { name: "lastName", maxCount: 1 },
    { name: "firstName", maxCount: 1 },
    { name: "patronymic", maxCount: 1 },
    { name: "phone", maxCount: 1 },
    { name: "mail", maxCount: 1 },
    { name: "password", maxCount: 1 },
    { name: "urlInvite", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    //проверка валидности данных
    const errorBody = registerSchema.validate(req.body);
    if (errorBody.error) {
      return sendError(res, {
        code: StatusCodes.BAD_REQUEST,
        error: ReasonPhrases.BAD_REQUEST,
        message: errorBody.error.details[0].message,
      });
    }
    const { lastName, firstName, patronymic, phone, mail, urlInvite } =
      req.body;

    const array = [0, 1, 2, 3];
    //создание пользователя
    const id = db.setUser({
      lastName: lastName.toString(),
      firstName: firstName.toString(),
      patronymic: patronymic ? patronymic.toString() : null,
      mail: mail.toString(),
      phone: Number(phone),
      password: req.body.password,
      urlInvite: urlInvite,
      videos: array,
    });
    //добавление роликов рефереру и приглашаемого
    const idInviter = db.getUrlInvite(urlInvite);
    const inviter = db.getUser(idInviter);
    array.forEach((v, i) => {
      if (!inviter.videos.includes(v)) inviter.videos.push(v);
    });
    const access = tokens.createAccessToken({ id: id });
    const refresh = tokens.createRefreshToken({ id: id });
    return res
      .status(StatusCodes.CREATED)
      .json({ access: access, refresh: refresh });
  }
);
//авторизация пользвоателя
app.post(
  "/api/login",
  upload.fields([
    { name: "mail", maxCount: 1 },
    { name: "password", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    const body = req.body;
    //валилдация формы
    const errorBody = loginSchema.validate(body);
    if (errorBody.error) {
      return sendError(res, {
        code: StatusCodes.BAD_REQUEST,
        error: ReasonPhrases.BAD_REQUEST,
        message: errorBody.error.details[0].message,
      });
    }
    //проверка зарегистирированной почты
    const resultSearch = db.searchUserByMail(body.mail);
    if (resultSearch === null)
      return sendError(res, {
        code: StatusCodes.BAD_REQUEST,
        error: ReasonPhrases.BAD_REQUEST,
        message: "not user is this mail",
      });
    //проверка верности почты
    if (body.password == resultSearch.password) {
      const accessToken = tokens.createAccessToken({ id: resultSearch.id });
      const refreshToken = tokens.createRefreshToken({ id: resultSearch.id });
      return res
        .status(StatusCodes.ACCEPTED)
        .json({ access: accessToken, refresh: refreshToken });
    }

    return sendError(res, {
      code: StatusCodes.BAD_REQUEST,
      error: ReasonPhrases.BAD_REQUEST,
      message: "failed password",
    });
  }
);

//создание ссылки
app.post(
  "/api/links/create",
  tokens.checkAccessToken,
  async (req: Request, res: Response) => {
    const rand = new Random(6);
    const id = (req as any).access;
    const key = await rand.generateString();
    const url = "http://localhost:3001/link/" + key;
    db.setUrlInvite(key, Number(id));
    return res.status(StatusCodes.CREATED).json({ url: url });
  }
);

//просмотр личной информации ссылки
app.get(
  "/api/links/my",
  tokens.checkAccessToken,
  (req: Request, res: Response) => {
    const id = (req as any).access;
    const resultSearch = db.searchLinkById(id);
    if (resultSearch === null)
      return res.status(StatusCodes.ACCEPTED).json({ url: null });

    const infLink = db.searchUserByUrlInvite(resultSearch.key);
    res.status(StatusCodes.ACCEPTED).json({
      url: "http://localhost:3001/link/" + resultSearch.key,
      users: infLink,
    });
  }
);

//обновление быстрого токена
app.get(
  "/api/token/update",
  tokens.updateAccessToken,
  (req: Request, res: Response) => {}
);

//получение всех видео с уточнением точки доступа
app.get(
  "/api/videos/all",
  tokens.checkAccessToken,
  (req: Request, res: Response) => {
    const id = (req as any).access;
    const user = db.getUser(id);
    const videos = db.getVideos();
    for (let i = 0; i < videos.length; i++) {
      if (user.videos.includes(videos[i].id)) {
        videos[i].accept = true;
      } else {
        //удаляем ссылку для безопасности
        videos[i].url = null;
      }
    }
    return res.status(StatusCodes.ACCEPTED).json({ videos: videos });
  }
);

//обработка оплаты
app.post(
  "/api/pay",
  tokens.checkAccessToken,
  upload.fields([
    { name: "id", maxCount: 1 },
    { name: "number", maxCount: 1 },
    { name: "date", maxCount: 1 },
    { name: "svv", maxCount: 1 },
  ]),
  (req: Request, res: Response) => {
    //валидация формы
    const errorBody = paySchema.validate(req.body);
    if (errorBody.error) {
      return sendError(res, {
        code: StatusCodes.BAD_REQUEST,
        error: ReasonPhrases.BAD_REQUEST,
        message: errorBody.error.details[0].message,
      });
    }
    const { id } = req.body;
    const userId = (req as any).access;
    const user = db.getUser(Number(userId));
    user.videos.push(Number(id));
    db.patchUser(Number(userId), user);
    return res.status(StatusCodes.ACCEPTED).json({ message: "good" });
  }
);
//получение статистики регистрации
app.get("/api/stat", (req: Request, res: Response) => {
  const url = db.returnKeysUrl();
  const users = db.returnAllUsers();
  const json: Array<{ key: string; count: number; users: Array<User> }> = [];
  url.forEach((v, i) => {
    const usersArray: Array<User> = users.filter(
      (vU, iU) => vU.urlInvite === v
    );
    json.push({ key: v, count: usersArray.length, users: usersArray });
  });
  return res.status(StatusCodes.OK).json({ stats: json });
});

app.listen(port, () => {
  console.log(
    `Сервер запущен: http://localhost:${port}\nДля регистрации первого пользователя перейдите по ссылке:\nhttp://localhost:${port}/link/one`
  );
});
export const sendError = async (
  res: Response,
  params: { code: number; error: string; message: string }
) => {
  return res.status(params.code).json({
    error: params.error,
    message: params.message,
  });
};
