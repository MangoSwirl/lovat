import {
  EventAction,
  Position,
  HighNoteResult,
  RobotRole,
  StageResult,
  PickUp,
  MatchType,
} from "@prisma/client";
import { z } from "zod";

const eventActions = [
  EventAction.LEAVE,
  EventAction.PICK_UP,
  EventAction.DROP_RING,
  EventAction.SCORE,
  EventAction.DEFENSE,
  EventAction.FEED_RING,
  "START",
  "STOP",
  EventAction.STARTING_POSITION,
] as const;

const fieldPositions = [
  Position.NONE,
  Position.AMP,
  Position.SPEAKER,
  Position.TRAP,
  Position.WING_NEAR_AMP,
  Position.WING_FRONT_OF_SPEAKER,
  Position.WING_CENTER,
  Position.WING_NEAR_SOURCE,
  Position.GROUND_NOTE_ALLIANCE_NEAR_AMP,
  Position.GROUND_NOTE_ALLIANCE_FRONT_OF_SPEAKER,
  Position.GROUND_NOTE_ALLIANCE_BY_SPEAKER,
  Position.GROUND_NOTE_CENTER_FARTHEST_AMP_SIDE,
  Position.GROUND_NOTE_CENTER_TOWARD_AMP_SIDE,
  Position.GROUND_NOTE_CENTER_CENTER,
  Position.GROUND_NOTE_CENTER_TOWARD_SOURCE_SIDE,
  Position.GROUND_NOTE_CENTER_FARTHEST_SOURCE_SIDE,
] as const;

const robotRoles = [
  RobotRole.OFFENSE,
  RobotRole.DEFENSE,
  RobotRole.FEEDER,
  RobotRole.IMMOBILE,
] as const;

const stageResults = [
  StageResult.NOTHING,
  StageResult.PARK,
  StageResult.ONSTAGE,
  StageResult.ONSTAGE_HARMONY,
] as const;

const pickUpResults = [PickUp.GROUND, PickUp.CHUTE, PickUp.BOTH] as const;

const highNoteResults = [
  HighNoteResult.NOT_ATTEMPTED,
  HighNoteResult.FAILED,
  HighNoteResult.SUCCESSFUL,
] as const;

const matchTypes = [MatchType.QUALIFICATION, MatchType.ELIMINATION] as const;

const inversedMatchTypes = Object.fromEntries(
  matchTypes.map((type, index) => [type, index])
);

const scouterScheduleMap = [
  "team1",
  "team2",
  "team3",
  "team4",
  "team5",
  "team6",
] as const;

const inversedScouterScheduleMap = Object.fromEntries(
  scouterScheduleMap.map((key, index) => [index, key])
);

const matchTypeShortNames = ["qm", "em"] as const;

const MatchEnumToAbrivation = {
  [MatchType.QUALIFICATION]: "qm",
  [MatchType.ELIMINATION]: "em",
} as const;

const MatchTypeEnumToFull = {
  0: MatchType.QUALIFICATION,
  1: MatchType.ELIMINATION,
} as const;

const mappedValueValidator = <T extends string | number>(
  values: readonly T[]
) =>
  z
    .number()
    .int()
    .min(0)
    .max(values.length - 1)
    .transform((n) => values[n]);

export {
  eventActions,
  fieldPositions,
  robotRoles,
  stageResults,
  pickUpResults,
  highNoteResults,
  matchTypes,
  scouterScheduleMap,
  inversedMatchTypes,
  inversedScouterScheduleMap,
  matchTypeShortNames,
  MatchTypeEnumToFull,
  MatchEnumToAbrivation,
  mappedValueValidator,
};
