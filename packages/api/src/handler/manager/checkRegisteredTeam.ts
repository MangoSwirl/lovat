import prismaClient from "../../prismaClient";
import { z } from "zod";
import { Request, Response } from "express";

export const checkRegisteredTeam = async (req: Request, res: Response) => {
  try {
    if (req.user === undefined) {
      res.status(401).send("Unauthorized");
      return;
    }

    const params = z
      .object({
        number: z.number().min(0),
      })
      .safeParse({
        number: Number(req.params.team),
      });

    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    const row = await prismaClient.registeredTeam.findUnique({
      where: {
        number: params.data.number,
      },
      include: {
        users: true,
      },
    });
    const featureToggle = await prismaClient.featureToggle.findUnique({
      where: {
        feature: "fullRegistration",
      },
    });
    if (row === null) {
      res.status(200).send({ status: "NOT_STARTED" });
    } else if (row.users[0]?.id === req.user.id) {
      if (row.emailVerified) {
        if (
          (featureToggle?.enabled && row.website) ||
          !!featureToggle?.enabled === false
        ) {
          if (row.teamApproved) {
            if (req.user.teamNumber === row.number) {
              res.status(200).send({ status: "REGISTERED_ON_TEAM" });
            } else {
              res.status(200).send({ status: "REGISTERED_OFF_TEAM" });
            }
          } else {
            res.status(200).send({
              status: "PENDING_TEAM_VERIFICATION",
              teamEmail: row.email,
            });
          }
        } else {
          res.status(200).send({ status: "PENDING_WEBSITE" });
        }
      } else {
        res
          .status(200)
          .send({ status: "PENDING_EMAIL_VERIFICATION", email: row.email });
      }
    } else {
      if (row.emailVerified && row.teamApproved) {
        if (req.user.teamNumber === row.number) {
          res.status(200).send({ status: "REGISTERED_ON_TEAM" });
        } else {
          res.status(200).send({ status: "REGISTERED_OFF_TEAM" });
        }
      } else {
        res.status(200).send({ status: "PENDING" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
