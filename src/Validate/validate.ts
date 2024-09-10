import { IsEmail, IsPhoneNumber, validate } from "class-validator";
import "reflect-metadata";
import { FIO } from "src/Interface/user";

class ValidatorMail {
  @IsEmail()
  mail?: string;
}

class ValidatorPhone {
  @IsPhoneNumber("RU")
  phone?: number;
}

class Validate {
  private validMail: ValidatorMail = new ValidatorMail();
  private validPhone: ValidatorPhone = new ValidatorPhone();
  public checkMail = async (value: string) => {
    this.validMail.mail = value;
    const error = await validate(this.validMail);
    if (error.length > 0) return false;
    return true;
  };
  public checkPhone = async (value: number) => {
    this.validPhone.phone = value;
    const error = await validate(this.validPhone);

    if (error.length > 0) return false;
    return true;
  };
  public checkFIO = (params: FIO) => {
    if (params.lastName.length < 2 || params.lastName.length > 22) return false;
    if (params.firstName.length < 2 || params.firstName.length > 22)
      return false;
    if (
      params.patronymic &&
      (params.firstName.length < 2 || params.firstName.length > 22)
    )
      return false;
    return true;
  };
}

export default Validate;
