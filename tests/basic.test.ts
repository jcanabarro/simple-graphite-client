import Sender from "../lib/index";
import {expect} from "chai";

class TestSender extends Sender {
    messages: Buffer[] = [];

    constructor(...args: any[]) {
        super("dummy_host", ...args);
    }

    send_socket(message: Buffer) {
        this.messages.push(message);
    }

    pop_message(): Buffer {
        if (this.messages.length === 0) {
            throw new Error("no messages sent");
        }
        return this.messages.shift()!;
    }
}

describe("TestBuildMessage", () => {
    it("test_no_prefix", () => {
        const sender = new TestSender();
        expect(sender.buildMessage("foo.bar", 42, 12345)).to.be.eql(Buffer.from("foo.bar 42 12345\n"));
        expect(sender.buildMessage("boo.far", 42.1, 12345.6)).to.be.eql(Buffer.from("boo.far 42.1 12346\n"));
    });

    it("test_unicode", () => {
        const sender = new TestSender();
        expect(sender.buildMessage("“foo.bar”", 42, 12345)).to.be.eql(Buffer.from("“foo.bar” 42 12345\n"));
    });

    it("test_prefix", () => {
        const sender = new TestSender(undefined, "pr.efix");
        expect(sender.buildMessage("boo.far", 567, 12347)).to.be.eql(Buffer.from("pr.efix.boo.far 567 12347\n"));
    });

    it("test_exceptions", () => {
        const sender = new TestSender();
        expect(() => sender.buildMessage("foo.bar", "x", 12346)).to.throw(TypeError);
    });

    it("test_tagging_none", () => {
        const sender = new TestSender();
        expect(sender.buildMessage("tag.test", 42, 12345)).to.be.eql(Buffer.from("tag.test 42 12345\n"));
    });

    it("test_tagging_single", () => {
        const sender = new TestSender();
        expect(sender.buildMessage("tag.test", 42, 12345, {"foo": "bar"})).to.be.eql(Buffer.from("tag.test;foo=bar 42 12345\n"));
    });

    it("test_tagging_multi", () => {
        const sender = new TestSender();
        expect(sender.buildMessage("tag.test", 42, 12345, {"foo": "bar", "ding": "dong"})).to.be.eql(Buffer.from("tag.test;foo=bar;ding=dong 42 12345\n"));
    });

    it("test_tagging_default", () => {
        const sender = new TestSender(undefined, undefined, undefined, undefined, {"foo": "bar"});
        expect(sender.buildMessage("tag.test", 42, 12345)).to.be.eql(Buffer.from("tag.test;foo=bar 42 12345\n"));
    });

    it("test_tagging_override", () => {
        const sender = new TestSender(undefined, undefined, undefined, undefined, {"foo": "bar", "ding": "dong"});
        expect(sender.buildMessage("tag.test", 42, 12345, {"foo": "not-bar"})).to.be.eql(Buffer.from("tag.test;foo=not-bar;ding=dong 42 12345\n"));
    });

    it("test_tagging_default_no_overlap", () => {
        const sender = new TestSender(undefined, undefined, undefined, undefined, {"foo": "bar"});
        expect(sender.buildMessage("tag.test", 42, 12345, {"ding": "dong"})).to.be.eql(Buffer.from("tag.test;foo=bar;ding=dong 42 12345\n"));
    });

    it("test_tagging_default_multi", () => {
        const sender = new TestSender(undefined, undefined, undefined, undefined, {"foobar": "42", "py": "thon"});
        expect(sender.buildMessage("tag.test", 42, 12345, {"foo": "bar", "ding": "dong"})).to.be.eql(Buffer.from("tag.test;foobar=42;py=thon;foo=bar;ding=dong 42 12345\n"));
    });
});
