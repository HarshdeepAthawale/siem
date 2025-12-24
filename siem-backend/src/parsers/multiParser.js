import { SSHParser } from './sshParser.js';
import { HTTPParser } from './httpParser.js';

export class MultiParser {
  constructor() {
    this.parsers = [
      new SSHParser(),
      new HTTPParser(),
    ];
  }

  async parse(rawLog) {
    for (const parser of this.parsers) {
      const result = await parser.parse(rawLog);
      if (result) {
        return result;
      }
    }
    return null;
  }
}

