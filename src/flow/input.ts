import inquirer from "inquirer";

import { GameState } from "../types";
import { assertNever } from "../utils";
import { BaseBlockClass } from "./base";
import { BlockType, InputField, InputBlock, InputFieldType } from "./types";

export class InputBlockClass extends BaseBlockClass {
  /*
   * A block for requesting input from the end user.
   * This block represents a form containing a series of fields that the user
   * must submit together. The value of each field is saved to its own variable.
   */
  type: BlockType.INPUT;
  form: InputField[];

  constructor(block: InputBlock) {
    super();
    this.form = block.form;
  }

  constructInquirerQuestions(gameState: GameState) {
    return this.form.map((field) => {
      const baseQuestion = {
        name: field.name.toLowerCase(),
        message: field.label,
      };

      switch (field.type) {
        case InputFieldType.BOOLEAN:
          return {
            ...baseQuestion,
            type: "confirm",
          };
        case InputFieldType.NUMBER:
          return { ...baseQuestion, type: "number" };
        case InputFieldType.CARD:
          // PROBLEM: We aren't actually removing the card from the hand when a user selects a card this way
          const allCards = gameState.parseExpression(field.options);
          const isOptionValid = gameState.parseExpression(field.isOptionValid);
          const choices = allCards.filter(isOptionValid).map((card) => ({
            name: JSON.stringify(card),
            value: { component: card },
          }));
          return {
            ...baseQuestion,
            type: "list",
            choices,
            loop: false,
          };
        default:
          assertNever(field);
      }
    });
  }

  async execute(currentState: GameState) {
    const questions = this.constructInquirerQuestions(currentState);
    const answers = await inquirer.prompt(questions);
    return new GameState({ ...currentState.variables, ...answers });
  }
}
