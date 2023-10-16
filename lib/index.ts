import { createSocket } from "dgram";
import { createConnection } from "net";

interface SenderConstructor {
    /**
     * The host of the graphite server.
     */
    host: string;
    /**
     * The port of the graphite server. Default value: 2003
     */
    port?: number;
    /**
     * A prefix to be sent for all your metrics name
     */
    prefix?: string;
    /**
     * The protocol to be used on the connection. Default value: 'tcp'
     */
    protocol?: "tcp" | "udp";
    /**
     * The timeout for the connection in seconds. Default value: 5
     */
    timeout?: number,
    /**
     * Tags to be sent for all your metrics. Ex.: {"tag_key": "tag_value"}
     */
    tags?: Record<string, string>
}

interface SendParameters {
    /**
     * metric name
     */
    metric: string;
    /**
     * metric value
     */
    value: number;
    /**
     * the timestamp in milliseconds. Default value: new Date().getTime()
     */
    timestamp?: number;
    /**
     * Tags to be sent for your metric. Ex.: {"tag_key": "tag_value"}
     */
    tags?: Record<string, string>;
}


export default class Sender {
    private host: string;
    private port: number;
    private prefix: string;
    private tags: Record<string, string>;
    private protocol: "tcp" | "udp";
    private timeout: number;

    constructor(
        { host, port = 2003, prefix, protocol = "tcp", timeout = 5, tags = {} }: SenderConstructor
    ) {
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

    private sendMessage(message: Buffer): Promise<void> {
        if (this.protocol === "tcp") {

            return new Promise((resolve, reject) => {

                const sock = createConnection({ host: this.host, port: this.port });
                sock.setTimeout(this.timeout * 1000);

                sock.once("timeout", () => {
                    sock.destroy(new Error("Timeout"));
                });

                sock.once("connect", () => {
                    sock.setKeepAlive(true);
                    sock.write(message);
                    sock.end();
                });

                sock.on("close", (hadError) => {
                    if (!hadError) {
                        resolve();
                    }
                });

                sock.once("error", (err) => {
                    sock.destroy(err);
                    reject(err);
                });

            });

        } else if (this.protocol === "udp") {
            return new Promise((resolve, reject) => {
                const sock = createSocket("udp4");
                sock.send(message, this.port, this.host, (error) => {
                    sock.close();

                    if (error) {
                        return reject(new Error(`error sending message ${message}: ${error}`));
                    }

                    resolve();
                });
            });
        } else {
            throw new Error(`"protocol" must be 'tcp' or 'udp', not ${this.protocol}`);
        }
    }

    private hasWhitespace(value: string): boolean {
        return !value || value.split(/\s+/)[0] !== value;
    }


    async send({ metric, value, timestamp, tags }: SendParameters): Promise<void> {
        const message = this.buildMessage(metric, value, timestamp || new Date().getTime(), tags);
        await this.sendMessage(message);
    }
}
