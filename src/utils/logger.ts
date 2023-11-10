import chalk from 'chalk';

export class Logger {
	private readonly _error: string;

	private readonly _warn: string;

	private readonly _info: string;

	public constructor() {
		this._error = chalk.red('Error');
		this._warn = chalk.yellow('Warn');
		this._info = chalk.green('Info');
	}

	public info(message: any) {
		console.log(this._prettify(message, this._info));
	}

	public warn(warn: any) {
		console.log(this._prettify(warn, this._warn));
	}

	public error(error: any) {
		console.log(this._prettify(error, this._error));
	}

	private _prettify(data: unknown, prefix: string) {
		return (typeof data === 'string' ? data : JSON.stringify(data, null, 3))
			.split('\n')
			.map(s => `[${prefix}] ${s}`)
			.join('\n');
	}
}
