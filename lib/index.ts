import { createSocket } from "dgram";
import { createConnection } from "net";


export default class Sender {
    host: string;
    port: number;
    prefix?: string;
    tags?: Record<string, string>;
    protocol?: string;
    timeout?: number;

    constructor(
        host: string,
        port = 2003,
        prefix: string | undefined = undefined,
        protocol = "tcp",
        timeout = 5,
        tags: Record<string, string> = {}
    ){
        this.host = host;
        this.port = port;
        this.prefix = prefix ? `${prefix}.` : "";
        this.protocol = protocol;
        this.tags = tags;
        this.timeout = timeout;
    }

    private buildMessage(metric: string, value: number, timestamp: number, tags: Record<string, string> = {}): Buffer {
        if (this.hasWhitespace(metric)) {
            throw new Error("\"metric\" must not have whitespace in it");
        }

        if (typeof value !== "number" || isNaN(value) || !isFinite(value)) {
            throw new TypeError(`"value" must be a finite number, not a ${typeof value}`);
        }

        const allTags: Record<string, string> = { ...this.tags, ...tags };
        const tagsStrings: string[] = [];

        for (const [key, val] of Object.entries(allTags)) {
            if (this.hasWhitespace(key) || this.hasWhitespace(val)) {
                throw new Error("\"tags\" keys and values must not have whitespace in them");
            }
            tagsStrings.push(`;${key}=${val}`);
        }

        const tagsSuffix = tagsStrings.join("");

        const message = `${this.prefix}${metric}${tagsSuffix} ${value} ${Math.round(timestamp)}\n`;
        return Buffer.from(message, "utf-8");
    }

    private sendMessage(message: Buffer): void {
        if (this.protocol === "tcp") {
            const sock = createConnection({ host: this.host, port: this.port, timeout: this.timeout });

            sock.once("connect", () => {
                sock.setKeepAlive(true);
                sock.write(message);
            });

            sock.once("error", (err) => {
                console.error("Socket error:", err);
                sock.destroy();
            });

        } else if (this.protocol === "udp") {
            const sock = createSocket("udp4");
            sock.send(message, this.port, this.host, (error) => {
                if (error) {
                    console.error(`error sending message ${message}: ${error}`);
                }
                sock.close();
            });
        } else {
            throw new Error(`"protocol" must be 'tcp' or 'udp', not ${this.protocol}`);
        }
    }

    private hasWhitespace(value: string): boolean {
        return !value || value.split(/\s+/)[0] !== value;
    }


    send(metric: string, value: number, timestamp: number | null = null, tags: Record<string, string> = {}): void {
        const message = this.buildMessage(metric, value, timestamp || Date.now(), tags);
        console.log(message);
        this.sendMessage(message);
    }
}
