import { abort, readJSON, interpretFileIndentation, writeJSON } from '../utils';

import { IDEConfig } from '../constants';
import type { Generator } from '../generator';
import type { Process } from '../types';
import type { Indentation } from '../utils';
import { normalizePath } from 'vite';

/**
 * Creates a JS or TS Configfile
 */

export async function writeConfig(gen: Generator, process: Process = 'default') {
	const { root, dir, useTypescript, useConfig } = gen.options;

	if (!useConfig) {
		return;
	}

	const name = useTypescript ? 'tsconfig' : 'jsconfig';
	const file = normalizePath(`${root}/${name}.json`);

	try {
		let [indentation, json]: [Indentation, any] = await Promise.all([
			interpretFileIndentation(file),
			readJSON(file),
		]);

		if (!json) {
			IDEConfig.compilerOptions.paths = { ...gen.paths };
			json = Object.assign({}, IDEConfig);
		}

		if (!json.compilerOptions) {
			json.compilerOptions = {
				paths: { ...gen.paths },
			};
		}

		let paths = json.compilerOptions.paths || {};

		if (process === 'remove') {
			paths = Object.fromEntries(
				Object.entries(paths).filter((p: any) => {
					if (Object.values(gen.paths).flat().includes(p[1][0]) && p[1][0].includes(dir)) {
						return p;
					} else if (!p[1][0].includes(dir)) {
						return p;
					}
				}),
			);
		}

		json.compilerOptions.paths = { ...paths, ...gen.paths };
		await writeJSON(file, json, process, indentation);
	} catch (error) {
		abort(`Cannot write Config: ${file}.`);
	}
}
