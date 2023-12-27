import Sender from "../lib/index";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as superagent from "superagent";

chai.use(chaiAsPromised);

describe("TestBuildMessage", () => {
    it("test_timeout", async () => {
        const sender = new Sender({ host: "localhost", port: 9528, timeout: 1 });

        await expect(sender.send({ metric: "foo.bar", value: 42 }))
            .to.eventually.be.rejectedWith(Error)
            .and.has.property("message", "Timeout");

        const res = await superagent.get("http://localhost:9528/pop_message").ok(() => true);
        expect(res.status).to.be.eql(404);

    });

    it("test_no_prefix", async () => {
        let res: superagent.Response;
        const sender = new Sender({ host: "localhost", port: 9950 });

        await sender.send({ metric: "foo.bar", value: 42, timestamp: 12345000 });
        res = await superagent.get("http://localhost:9528/pop_message");
        expect(res.text).to.be.eql("foo.bar 42 12345\n");

        await sender.send({ metric: "foo.bar", value: 42.1, timestamp: 12345600 });
        res = await superagent.get("http://localhost:9528/pop_message");
        expect(res.text).to.be.eql("foo.bar 42.1 12346\n");
    });

    it("test_unicode", async () => {
        const sender = new Sender({ host: "localhost", port: 9950 });
        await sender.send({ metric: "“foo.bar”", value: 42, timestamp: 12345000 });
        const res = await superagent.get("http://localhost:9528/pop_message");
        expect(res.text).to.be.eql("“foo.bar” 42 12345\n");
    });

    it("test_prefix", async () => {
        const sender = new Sender({ host: "localhost", port: 9950, prefix: "pr.efix" });
        await sender.send({ metric: "boo.far", value: 567, timestamp: 12347000 });
        const res = await superagent.get("http://localhost:9528/pop_message");
        expect(res.text).to.be.eql("pr.efix.boo.far 567 12347\n");
    });

    it("test_exceptions", async () => {
        const sender = new Sender({ host: "localhost", port: 9950, prefix: "pr.efix" });
        await expect(sender.send({ metric: "foo.bar", value: "x" }))
            .to.eventually.be.rejectedWith(TypeError);
    });

    it("test_tagging_single", async () => {
        const sender = new Sender({ host: "localhost", port: 9950 });
        await sender.send({ metric: "tag.test", value: 42, timestamp: 12345000, tags: { "foo": "bar" } });
        const res = await superagent.get("http://localhost:9528/pop_message");
        expect(res.text).to.be.eql("tag.test;foo=bar 42 12345\n");
    });

    it("test_tagging_multi", async () => {
        const sender = new Sender({ host: "localhost", port: 9950 });
        await sender.send({ metric: "tag.test", value: 42, timestamp: 12345000, tags: { "foo": "bar", "ding": "dong" } });
        const res = await superagent.get("http://localhost:9528/pop_message");
        expect(res.text).to.be.eql("tag.test;foo=bar;ding=dong 42 12345\n");
    });

    it("test_tagging_default", async () => {
        const sender = new Sender({ host: "localhost", port: 9950, tags: { "foo": "bar" } });
        await sender.send({ metric: "tag.test", value: 42, timestamp: 12345000 });
        const res = await superagent.get("http://localhost:9528/pop_message");
        expect(res.text).to.be.eql("tag.test;foo=bar 42 12345\n");
    });

    it("test_tagging_override", async () => {
        const sender = new Sender({ host: "localhost", port: 9950, tags: { "foo": "bar", "ding": "dong" } });
        await sender.send({ metric: "tag.test", value: 42, timestamp: 12345000, tags: { "foo": "not-bar" } });
        const res = await superagent.get("http://localhost:9528/pop_message");
        expect(res.text).to.be.eql("tag.test;foo=not-bar;ding=dong 42 12345\n");
    });

    it("test_tagging_default_no_overlap", async () => {
        const sender = new Sender({ host: "localhost", port: 9950, tags: { "foo": "bar" } });
        await sender.send({ metric: "tag.test", value: 42, timestamp: 12345000, tags: { "ding": "dong" } });
        const res = await superagent.get("http://localhost:9528/pop_message");
        expect(res.text).to.be.eql("tag.test;foo=bar;ding=dong 42 12345\n");
    });

    it("test_tagging_default_multi", async () => {
        const sender = new Sender({ host: "localhost", port: 9950, tags: { "foo": "bar", "node": "js" } });
        await sender.send({ metric: "tag.test", value: 42, timestamp: 12345000, tags: { "foo": "bar", "ding": "dong" } });
        const res = await superagent.get("http://localhost:9528/pop_message");
        expect(res.text).to.be.eql("tag.test;foo=bar;node=js;ding=dong 42 12345\n");
    });

    it("test_udp_protocol", async () => {
        const sender = new Sender({ host: "localhost", port: 9950, protocol: "udp" });
        await sender.send({ metric: "udp.test", value: 42 });
    });

    it("test_udp_protocol_with_error", async () => {
        const sender = new Sender({ host: "invalid_host", port: 9950, protocol: "udp" });
        await expect(sender.send({ metric: "udp.test", value: 42 }))
            .to.eventually.be.rejectedWith(Error);
    });

    it("invalid_protocol", async () => {
        const sender = new Sender({ host: "localhost", port: 9950, protocol: "xxx" });
        await expect(sender.send({ metric: "udp.test", value: 42 }))
            .to.eventually.be.rejectedWith(Error)
            .and.has.property("message", "\"protocol\" must be 'tcp' or 'udp', not xxx");
    });

    it("invalid_message", async () => {
        const sender = new Sender({ host: "localhost", port: 9950 });
        await expect(sender.send({ metric: "invalid metric", value: 42 }))
            .to.eventually.be.rejectedWith(Error)
            .and.has.property("message", "\"metric\" must not have whitespace in it");

    });

    it("invalid_tag_key", async () => {
        const sender = new Sender({ host: "localhost", port: 9950 });
        await expect(sender.send({ metric: "invalid.tag", value: 42, tags: { "invalid tag": "bar" } }))
            .to.eventually.be.rejectedWith(Error)
            .and.has.property("message", "\"tags\" keys and values must not have whitespace in them");

    });

    it("invalid_tag_value", async () => {
        const sender = new Sender({ host: "localhost", port: 9950 });
        await expect(sender.send({ metric: "invalid.tag", value: 42, tags: { "foo": "invalid value" } }))
            .to.eventually.be.rejectedWith(Error)
            .and.has.property("message", "\"tags\" keys and values must not have whitespace in them");

    });

    after(async () => {
        await superagent.get("http://localhost:9528/reset_messages").ok(() => true);
    });
});
