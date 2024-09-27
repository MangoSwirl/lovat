import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import { UserRole } from "@prisma/client";

export const getAnalysts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user === undefined) {
      res.status(401).send("Unauthorized");
      return;
    }

    if (req.user.teamNumber === null) {
      res.status(404).send("Not affilated with a team");
      return;
    }
    if (req.user.role !== "SCOUTING_LEAD") {
      res.status(403).send("Not a scouting lead");
      return;
    }
    const analystsOnTeam = await prismaClient.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
      },
      where: {
        teamNumber: req.user.teamNumber,
        role: UserRole.ANALYST,
      },
    });
    res.status(200).send(analystsOnTeam);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
