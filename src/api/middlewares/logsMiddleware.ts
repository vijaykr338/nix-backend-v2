import util from 'node:util';
const exec = util.promisify(require('node:child_process').exec);
import asyncErrorHandler from "../helpers/asyncErrorHandler";

const num_lines = 150;

export const get_logs = asyncErrorHandler(async (req, res, next) => {
    const { stdout } = await exec(`npx pm2 logs --nostream NixBackend --lines ${num_lines} --raw --out`);
    const { stdout: stderr } = await exec(`npx pm2 logs --nostream NixBackend --lines ${num_lines} --raw --err`);
    res.send(`<h1>stdout</h1><pre>${stdout}</pre><h1>stderr</h1><pre>${stderr}</pre>`);
});

export const clear_logs = asyncErrorHandler(async (req, res, next) => {
    const { stdout } = await exec(`npx pm2 flush NixBackend`);
    res.send(`<h1>Clearing logs</h1><pre>${stdout}</pre>`);
})
