import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import { z } from "zod";
import { addTournamentMatches } from "./addTournamentMatches";
import { totalPointsScoutingLead } from "../analysis/scoutingLead/totalPointsScoutingLead";
import {
  eventActions,
  fieldPositions,
  highNoteResults,
  mappedValueValidator,
  matchTypes,
  pickUpResults,
  robotRoles,
  stageResults,
} from "./managerConstants";

export const addScoutReportDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user === undefined) {
      res.status(401).send("Unauthorized");
      return;
    }

    const paramsScoutReport = z
      .object({
        uuid: z.string(),
        startTime: z.number(),
        notes: z.string(),
        robotRole: mappedValueValidator(robotRoles),
        stage: mappedValueValidator(stageResults),
        highNote: mappedValueValidator(highNoteResults),
        pickUp: mappedValueValidator(pickUpResults),

        driverAbility: z.number(),
        scouterUuid: z.string(),
        matchType: mappedValueValidator(matchTypes),
        matchNumber: z.number(),
        tournamentKey: z.string(),
        teamNumber: z.number(),
      })
      .safeParse(req.body);
    if (!paramsScoutReport.success) {
      res.status(400).send({
        error: paramsScoutReport,
        displayError:
          "Invalid input. Make sure you are using the correct input.",
      });
      return;
    }
    const scouter = await prismaClient.scouter.findUnique({
      where: {
        uuid: paramsScoutReport.data.scouterUuid,
      },
    });
    if (!scouter) {
      res.status(400).send({
        error: `This ${paramsScoutReport.data.scouterUuid} has been deleted or never existed.`,
        displayError:
          "This scouter has been deleted. Have the scouter reset their settings and choose a new scouter.",
      });
      return;
    }
    if (
      req.user.teamNumber === null ||
      scouter.sourceTeamNumber !== req.user.teamNumber
    ) {
      res.status(401).send({
        error: `User with the id ${req.user.id} is not on the same team as the scouter with the uuid ${scouter.uuid}`,
        displayError: "Not on the same team as the scouter.",
      });
      return;
    }
    const scoutReportUuidRow = await prismaClient.scoutReport.findUnique({
      where: {
        uuid: paramsScoutReport.data.uuid,
      },
    });
    if (scoutReportUuidRow) {
      res.status(400).send({
        error: `The scout report uuid ${paramsScoutReport.data.uuid} already exists.`,
        displayError: "Scout report already uploaded",
      });
      return;
    }

    const tournamentMatchRows = await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: paramsScoutReport.data.tournamentKey,
      },
    });
    if (tournamentMatchRows === null || tournamentMatchRows.length === 0) {
      await addTournamentMatches(paramsScoutReport.data.tournamentKey);
    }
    const matchRow = await prismaClient.teamMatchData.findFirst({
      where: {
        tournamentKey: paramsScoutReport.data.tournamentKey,
        matchNumber: paramsScoutReport.data.matchNumber,
        matchType: paramsScoutReport.data.matchType,
        teamNumber: paramsScoutReport.data.teamNumber,
      },
    });
    if (!matchRow) {
      res.status(404).send({
        error: `There are no matches that meet these requirements. ${paramsScoutReport.data.tournamentKey}, ${paramsScoutReport.data.matchNumber}, ${paramsScoutReport.data.matchType}, ${paramsScoutReport.data.teamNumber}`,
        displayError: "Match does not exist",
      });
      return;
    }
    const matchKey = matchRow.key;

    const row = await prismaClient.scoutReport.create({
      data: {
        //constants
        uuid: paramsScoutReport.data.uuid,
        teamMatchKey: matchKey,
        startTime: new Date(paramsScoutReport.data.startTime),
        scouterUuid: paramsScoutReport.data.scouterUuid,
        notes: paramsScoutReport.data.notes,
        robotRole: paramsScoutReport.data.robotRole,
        driverAbility: paramsScoutReport.data.driverAbility,
        //game specfific
        highNote: paramsScoutReport.data.highNote,
        stage: paramsScoutReport.data.stage,
        pickUp: paramsScoutReport.data.pickUp,
      },
    });
    const scoutReportUuid = row.uuid;
    const eventDataArray = [];
    const events = req.body.events;
    let ampOn = false;
    for (let i = 0; i < events.length; i++) {
      let points = 0;

      const [time, actionNum, positionNum] = events[i];
      const position = fieldPositions[positionNum];
      const action = eventActions[actionNum];

      if (action === "START") {
        ampOn = true;
      } else if (action === "STOP") {
        ampOn = false;
      } else if (time <= 18) {
        if (action === "SCORE") {
          if (position === "AMP") {
            points = 2;
          } else if (position === "SPEAKER") {
            points = 5;
          }
        } else if (action === "LEAVE") {
          points = 2;
        }
      } else {
        if (action === "SCORE") {
          if (position === "AMP") {
            points = 1;
          } else if (position === "SPEAKER" && ampOn) {
            points = 5;
          } else if (position === "SPEAKER") {
            points = 2;
          } else if (position === "TRAP") {
            points = 5;
          }
        }
      }
      if (action !== "START" && action !== "STOP") {
        const paramsEvents = z
          .object({
            time: z.number(),
            action: z.enum([
              "DEFENSE",
              "SCORE",
              "PICK_UP",
              "LEAVE",
              "DROP_RING",
              "FEED_RING",
              "STARTING_POSITION",
            ]),
            position: z.enum([
              "NONE",
              "AMP",
              "SPEAKER",
              "TRAP",
              "WING_NEAR_AMP",
              "WING_FRONT_OF_SPEAKER",
              "WING_CENTER",
              "WING_NEAR_SOURCE",
              "GROUND_NOTE_ALLIANCE_NEAR_AMP",
              "GROUND_NOTE_ALLIANCE_FRONT_OF_SPEAKER",
              "GROUND_NOTE_ALLIANCE_BY_SPEAKER",
              "GROUND_NOTE_CENTER_FARTHEST_AMP_SIDE",
              "GROUND_NOTE_CENTER_TOWARD_AMP_SIDE",
              "GROUND_NOTE_CENTER_CENTER",
              "GROUND_NOTE_CENTER_TOWARD_SOURCE_SIDE",
              "GROUND_NOTE_CENTER_FARTHEST_SOURCE_SIDE",
            ]),
            points: z.number(),
            scoutReportUuid: z.string(),
          })
          .safeParse({
            scoutReportUuid: scoutReportUuid,
            time: time,
            action: action,
            position: position,
            points: points,
          });
        if (!paramsEvents.success) {
          res.status(400).send({
            error: paramsEvents,
            displayError:
              "Invalid input. Make sure you are using the correct input.",
          });
          return;
        }
        eventDataArray.push({
          time: paramsEvents.data.time,
          action: paramsEvents.data.action,
          position: paramsEvents.data.position,
          points: paramsEvents.data.points,
          scoutReportUuid: scoutReportUuid,
        });
      }
    }
    await prismaClient.event.createMany({
      data: eventDataArray,
    });
    await totalPointsScoutingLead(scoutReportUuid);
    //recalibrate the max resonable points for every year
    //uncomment for scouting lead page
    // if (totalPoints === 0 || totalPoints > 80) {
    //     await prismaClient.flaggedScoutReport.create({
    //         data:
    //         {
    //             note: `${totalPoints} recorded, not including endgame`,
    //             scoutReportUuid: scoutReportUuid
    //         }

    //     })
    // }
    res.status(200).send("done adding data");
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
