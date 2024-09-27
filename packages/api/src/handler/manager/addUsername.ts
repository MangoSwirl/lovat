import { Request, Response } from "express";
import prismaClient from "../../prismaClient";

export const addUsername = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user === undefined) {
      res.status(401).send("Unauthorized");
      return;
    }

    const user = req.user;

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        username: String(req.body.username),
      },
    });
    res.status(200).send("username added");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
