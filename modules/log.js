module.exports = {
    name: "logUploader",

    LOG_FILE_PATTERNS: [
        "latest.log",
        "debug.log",
        "crash",
        ".log",
        ".txt"
    ],

    isLogFile(name) {
        name = name.toLowerCase();
        return this.LOG_FILE_PATTERNS.some(p => name.includes(p));
    },

    async upload(text) {
        try {
            const res = await fetch("https://api.mclo.gs/1/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text })
            });

            const data = await res.json();
            return data.url;
        } catch (e) {
            console.error("Upload failed:", e);
            return null;
        }
    },

    async handleMessage(message, force = false) {
        if (!message.attachments.size) return;

        for (const attachment of message.attachments.values()) {
            const name = attachment.name || "file";

            const detectedLog = this.isLogFile(name);
            let content = null;

            if (detectedLog || force) {
                try {
                    const res = await fetch(attachment.url);
                    content = await res.text();
                } catch {
                    continue;
                }
            }

            if (!detectedLog && !force) continue;
            if (typeof content !== "string") continue;

            try {
                await message.react("📃");
            } catch {}

            const url = await this.upload(content);

            if (!url) {
                await message.reply("Failed to upload");
                continue;
            }

            await message.reply(`${url}`);
        }
    },

    prefix: {
        name: "log",

        async execute(message, args, client) {
            let targetMessage = null;

            if (message.reference?.messageId) {
                try {
                    targetMessage = await message.channel.messages.fetch(message.reference.messageId);
                } catch {}
            }

            if (!targetMessage && args[0]) {
                try {
                    targetMessage = await message.channel.messages.fetch(args[0]);
                } catch {}
            }

            if (!targetMessage) {
                await message.reply("Reply to a message with a file or provide a message ID");
                return;
            }

            await module.exports.handleMessage(targetMessage, true);
        }
    },

    events: {
        async messageCreate(message, client) {
            if (message.author.bot) return;

            await module.exports.handleMessage(message, false);
        }
    }
};