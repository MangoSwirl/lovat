import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import { Resend } from "resend";

export const resendEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user === undefined) {
      res.status(401).send("Unauthorized");
      return;
    }

    if (!req.user.teamNumber) {
      res.status(400).send("Not on a team");
      return;
    }

    const teamRow = await prismaClient.registeredTeam.findUnique({
      where: {
        number: req.user.teamNumber,
      },
    });

    if (teamRow === null) {
      res.status(404).send("team not found");
      return;
    }

    const verificationUrl = `lovat.app/verify/${teamRow.code}`;
    const resend = new Resend(process.env.RESEND_KEY);

    resend.emails.send({
      from: "noreply@lovat.app",
      to: req.body.email,
      subject: "Lovat Email Verification",
      html: `<p>Welcome to Lovat, click <a href="${verificationUrl}" target="_blank">here</a> to verify your team email!</p>`,
    });

    res.status(200).send("verification email sent");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
