import { Request, Response } from "express";
import prismaClient from "../../prismaClient";

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user === undefined) {
      res.status(401).send("Unauthorized");
      return;
    }

    const checkScoutingLead = await prismaClient.user.findMany({
      where: {
        teamNumber: req.user.teamNumber,
        role: "SCOUTING_LEAD",
      },
    });

    if (req.user.role === "SCOUTING_LEAD" && checkScoutingLead.length === 1) {
      res
        .status(400)
        .send("Cannot delete the only scouting lead for the given team");
      return;
    } else if (
      req.user.role === "SCOUTING_LEAD" &&
      checkScoutingLead.length === 1
    ) {
      res
        .status(400)
        .send("Cannot delete the only scouting lead for the given team");
      return;
    } else {
      await prismaClient.user.delete({
        where: {
          id: req.user.id,
        },
      });
      res.status(200).send("User deleted");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
