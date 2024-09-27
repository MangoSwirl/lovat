import { Request, Response } from "express";
import prismaClient from "../../prismaClient";

export const addNotOnTeam = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (req.user === undefined) {
    res.status(401).send("Unauthorized");
    return;
  }

  try {
    const user = await prismaClient.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        teamNumber: null,
        role: "ANALYST",
      },
    });
    res.status(200).send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
