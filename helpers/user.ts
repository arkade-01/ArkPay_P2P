import { UserModel } from "../models/user";


async function getUser(telegram_id: number) {
  try {
    const user = await UserModel.findOne({ telegram_id });
    if (!user) {
      const newUser = await UserModel.create({ telegram_id });

      await newUser.save();
    }

    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("Failed to fetch user");
  }
}

export default getUser;