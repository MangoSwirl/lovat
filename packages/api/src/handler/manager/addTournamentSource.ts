import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import { z } from "zod";

export const addTournamentSource = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user === undefined) {
      res.status(401).send("Unauthorized");
      return;
    }

    const user = req.user;

    const params = z
      .object({
        tournamentSource: z.array(z.string()),
      })
      .safeParse({
        tournamentSource: req.body.tournaments,
      });

    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        tournamentSource: params.data.tournamentSource,
      },
    });
    res.status(200).send("tournament sources added");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
