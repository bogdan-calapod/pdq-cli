#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { registerConnectCommand } from "./connect/index.js";
import { registerDetectCommand } from "./detect/index.js";
import { SKILL_CONTENT } from "./skill.js";

const program = new Command();

program.name("pdq").description("CLI for PDQ products").version("0.1.0");

registerConnectCommand(program);
registerDetectCommand(program);

program
  .command("get-skill")
  .description(
    "Print a SKILL.md for use with AI coding assistants (e.g. save to .opencode/skills/pdq-cli/SKILL.md)"
  )
  .option("-o, --out <path>", "Write the skill file to this path instead of stdout")
  .action((opts: { out?: string }) => {
    if (opts.out) {
      const dest = path.resolve(opts.out);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, SKILL_CONTENT, "utf-8");
      console.log(`Skill file written to ${dest}`);
    } else {
      process.stdout.write(SKILL_CONTENT);
    }
  });

program.parse(process.argv);
