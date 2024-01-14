import util from "node:util";
import { exec as exec_sync } from "node:child_process";
const exec = util.promisify(exec_sync);
import asyncErrorHandler from "../helpers/asyncErrorHandler";

const default_num_lines = 150;

export const get_logs = asyncErrorHandler(async (req, res, _next) => {
  const num_lines = req.body.lines || default_num_lines;

  const { stdout } = await exec(`npx pm2 logs --nostream NixBackend --lines ${num_lines} --raw --out`);
  const { stdout: stderr } = await exec(`npx pm2 logs --nostream NixBackend --lines ${num_lines} --raw --err`);
  res.send(`<h1>stdout</h1><pre>${stdout}</pre><h1>stderr</h1><pre>${stderr}</pre>`);
});

export const clear_logs = asyncErrorHandler(async (req, res, _next) => {
  const { stdout } = await exec("npx pm2 flush NixBackend");
  res.send(`<h1>Clearing logs</h1><pre>${stdout}</pre>`);
});
