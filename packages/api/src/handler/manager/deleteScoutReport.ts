import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import { z } from "zod";

export const deleteScoutReport = async (
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
        uuid: z.string(),
      })
      .safeParse({
        uuid: req.params.uuid,
      });

    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    const scouter = await prismaClient.scoutReport.findUnique({
      where: {
        uuid: params.data.uuid,
      },
      include: {
        scouter: true,
      },
    });
    if (scouter === null) {
      res.status(404).send("Scouter or scout report not found");
      return;
    }

    if (
      scouter.scouter.sourceTeamNumber === user.teamNumber &&
      user.role === "SCOUTING_LEAD"
    ) {
      await prismaClient.event.deleteMany({
        where: {
          scoutReportUuid: params.data.uuid,
        },
      });
      await prismaClient.scoutReport.delete({
        where: {
          uuid: params.data.uuid,
        },
      });
      res.status(200).send("Data deleted successfully");
    } else {
      res.status(403).send("Unauthorized to delete this picklist");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
