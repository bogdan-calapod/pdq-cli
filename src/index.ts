#!/usr/bin/env node
import { Command } from "commander";
import { registerConnectCommand } from "./connect/index.js";

const program = new Command();

program
  .name("pdq")
  .description("CLI for PDQ products")
  .version("0.1.0");

registerConnectCommand(program);

program.parse(process.argv);
