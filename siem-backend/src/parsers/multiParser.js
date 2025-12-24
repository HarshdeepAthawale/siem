import { SSHParser } from './sshParser.js';
import { HTTPParser } from './httpParser.js';
import { WindowsEventParser } from './windowsEventParser.js';

export class MultiParser {
  constructor() {
    // Priority order: Windows events first (most specific), then SSH, then HTTP
    this.parsers = [
      new WindowsEventParser(),
      new SSHParser(),
      new HTTPParser(),
    ];
  }

  async parse(rawLog) {
    for (const parser of this.parsers) {
      const result = await parser.parse(rawLog);
      if (result) {
        // Add parser metadata
        result.parser_name = parser.name;
        return result;
      }
    }
    return null;
  }
}

