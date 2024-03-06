import range from "lodash/range";
import inquirer from "inquirer";

export type PlayerCountRange = {
  min: number;
  max: number;
};

export const requestNumPlayers = async (playerCountRange: PlayerCountRange) => {
  const question = {
    type: "list",
    name: "numPlayers",
    message: "How many players?",
    default: playerCountRange.min,
    choices: range(playerCountRange.min, playerCountRange.max + 1),
  };
  const answers = await inquirer.prompt([question]);
  return answers.numPlayers;
};
