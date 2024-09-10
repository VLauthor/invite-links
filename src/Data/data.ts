import { User, Video } from "src/Interface/user";
import * as fs from "fs";
//модуль для сохранения данных между перезапусками проекта (так как нет базы данных)
class Data {
  private users: Map<number, User>;
  private urlInvite: Map<string, number>;
  private videos: Map<number, Video>;
  private readonly urlFilePath: string = "./urlTable.json";
  private readonly userFilePath: string = "./usersTable.json";
  private readonly videosPath: string = "./videos.json";

  constructor() {
    this.users = new Map();
    this.urlInvite = new Map();
    this.readUserInHash();
    this.readUrlInHash();
    this.readVideosInHash();
  }

  public setUser = (user: User): number => {
    const id: number = this.users.size;
    this.users.set(id, user);
    this.saveUserToJson(id, user);

    return id;
  };
  public patchUser = (id: number, user: User): number => {
    this.users.set(id, user);
    this.saveUserToJson(id, user);
    return id;
  };
  public searchUserByMail = (
    mail: string
  ): { id: number; password: string } | null => {
    for (const [id, user] of this.users.entries()) {
      if (user.mail === mail) {
        return { id, password: user.password };
      }
    }
    return null;
  };

  public searchUserByUrlInvite = (key: string): Array<string> => {
    const users: Array<string> = [];
    this.users.forEach((v, k) => {
      if (v.urlInvite === key)
        users.push(
          `${v.lastName} ${v.firstName}${
            v.patronymic !== null ? " " + v.patronymic : ""
          }`
        );
    });
    return users;
  };

  public searchLinkById = (id: number): { key: string; id: number } | null => {
    for (const [key, idI] of this.urlInvite.entries()) {
      if (idI === id) {
        return { key: key, id: idI };
      }
    }
    return null;
  };
  public returnAllUsers = (): User[] => {
    return Array.from(this.users.values());
  };
  public returnKeysUrl = (): string[] => {
    return Array.from(this.urlInvite.keys());
  };
  public hasUser = (id: number): boolean => {
    if (this.users.has(id)) return true;
    return false;
  };
  public getUser = (id: number): User | null => {
    const user = this.users.get(id);
    if (user === undefined) return null;
    return user;
  };
  public getVideos = (): Video[] => {
    let array: Video[] = [];
    this.videos.forEach((v, k) => {
      array.push({
        id: k,
        name: v.name,
        url: v.url,
        accept: false,
      });
    });
    return array;
  };
  public setUrlInvite = (id: string, value: number): void => {
    this.urlInvite.set(id, value);
    this.saveUrlInviteToJson(id, value);
  };
  public getUrlInvite = (id: string): number => {
    return this.urlInvite.get(id);
  };
  public hasUrlInvite = (id: string): boolean => {
    return this.urlInvite.has(id);
  };

  private saveUserToJson = (id: number, user: User): void => {
    if (!fs.existsSync(this.userFilePath)) {
      return;
    }
    const readUsersFile: string = fs.readFileSync(this.userFilePath, "utf-8");
    const usersJsonData = JSON.parse(readUsersFile);
    usersJsonData[id] = user;
    const updatedUserData = JSON.stringify(usersJsonData, null, 2);
    fs.writeFileSync(this.userFilePath, updatedUserData, "utf8");
  };
  private saveUrlInviteToJson = (id: string, value: number): void => {
    if (!fs.existsSync(this.urlFilePath)) {
      return;
    }
    const readUrlFile: string = fs.readFileSync(this.urlFilePath, "utf-8");
    const urlJsonData = JSON.parse(readUrlFile);
    urlJsonData[id] = value;
    const updateUrlData = JSON.stringify(urlJsonData, null, 2);
    fs.writeFileSync(this.urlFilePath, updateUrlData, "utf-8");
  };
  private readVideosInHash = (): void => {
    const readVideosFile: string = fs.readFileSync(this.videosPath, "utf-8");
    const videosJsonData: Map<number, Video> = JSON.parse(readVideosFile);
    const videos: [number, Video][] = Object.entries(videosJsonData).map(
      ([key, value]) => [Number(key), value as Video]
    );
    this.videos = new Map(videos);
  };
  private readUserInHash = (): void => {
    const readUsersFile: string = fs.readFileSync(this.userFilePath, "utf-8");
    const usersJsonData: Map<number, User> = JSON.parse(readUsersFile);
    const usersArray: [number, User][] = Object.entries(usersJsonData).map(
      ([key, value]) => [Number(key), value as User]
    );
    this.users = new Map(usersArray);
  };
  private readUrlInHash = (): void => {
    const readUrlFile: string = fs.readFileSync(this.urlFilePath, "utf-8");
    const urlJsonData: Map<string, number> = JSON.parse(readUrlFile);
    const urlArray: [string, number][] = Object.entries(urlJsonData).map(
      ([key, value]) => [key, Number(value) as number]
    );
    this.urlInvite = new Map(urlArray);
  };
}

export default Data;
