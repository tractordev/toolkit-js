// @ts-ignore
import * as util from "../mux/util.ts";

export class Session {
    port: MessagePort;
    channels: Array<Channel>;
    incoming: util.queue<Channel>;
    closed: boolean;

    constructor(port: MessagePort) {
        this.channels = [];
        this.incoming = new util.queue();
        this.closed = false;
        this.port = port;
        this.port.onmessage = (event: any) => {
            const msg = event.data;
            console.log("session message: ", msg);
            if (msg.type === "open") {
                const ch = new Channel(this, msg.port);
                this.channels.push(ch);
                this.incoming.push(ch);
                return;
            }
            console.error("unknown session message type: ", msg.type);
        };
    }

    async open(): Promise<Channel> {
        const msgCh = new MessageChannel();
        const ch = new Channel(this, msgCh.port1);
        this.port.postMessage({ type: "open", port: msgCh.port2 }, [msgCh.port2]);
        return ch;
    }

    accept(): Promise<Channel | null> {
        return this.incoming.shift();
    }

    async close(): Promise<void> {
        for (const ch of this.channels) {
            ch.shutdown();
        }
        this.port.close();
        this.closed = true;
        return;
    }
}

export class Channel {
    port: MessagePort;
    session: Session;
    sentEOF: boolean;
    sentClose: boolean;
    readBuf: util.ReadBuffer;

    constructor(session: Session, port: MessagePort) {
        this.session = session;
        this.sentEOF = false;
        this.sentClose = false;
        this.readBuf = new util.ReadBuffer();
        this.port = port;
        this.port.onmessage = (event: any) => {
            const msg = event.data;
            console.log("channel message: ", msg);
            switch (msg.type) {
                case "data":
                    this.readBuf.write(msg.data);
                    break;
                case "eof":
                    this.readBuf.eof();
                    break;
                case "close":
                    this.close();
                    break;
                default:
                    console.error("unknown channel message type: ", msg.type);
                    break;
            }
        };
    }

    async read(p: Uint8Array): Promise<number | null> {
        return await this.readBuf.read(p);
    }

    write(p: Uint8Array): Promise<number> {
        if (this.sentEOF) {
            return Promise.reject("EOF");
        }
        this.port.postMessage({ type: "data", data: p }, [p.buffer]);
        return Promise.resolve(p.byteLength);
    }

    async close(): Promise<void> {
        this.readBuf.eof();
        if (!this.sentClose) {
            this.port.postMessage({ type: "close" });
            this.sentClose = true;
            return;
        }
        this.shutdown();
    }

    async closeWrite(): Promise<void> {
        this.sentEOF = true;
        this.port.postMessage({ type: "eof" });
        return;
    }

    shutdown(): void {
        this.readBuf.close();
        this.session.channels.splice(this.session.channels.indexOf(this), 1);
    }
}