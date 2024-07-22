const { Client, LocalAuth, Chat } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const moment = require("moment-timezone");
const colors = require("colors");
const fs = require("fs");
const fetch = require("cross-fetch");
const config = require("./config/config.json");
const dateObj = new Date();

const LogService = require("./src/Services/LogService");
const logService = new LogService();

const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    ffmpeg: "./ffmpeg.exe",
    authStrategy: new LocalAuth({ clientId: "client" }),
});

let date = ("0" + dateObj.getDate()).slice(-2);
let month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
let year = dateObj.getFullYear();
let hours = dateObj.getHours();
let minutes = dateObj.getMinutes();
let seconds = dateObj.getSeconds();

client.on("qr", (qr) => {
    console.log(`[${moment().tz(config.timezone).format("HH:mm:ss")}] Scan the QR below : `);
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    const consoleText = "./config/console.txt";
    fs.readFile(consoleText, "utf-8", (err, data) => {
        if (err) {
            console.log(`[${moment().tz(config.timezone).format("HH:mm:ss")}] Console Text not found!`.yellow);
            console.log(`[${moment().tz(config.timezone).format("HH:mm:ss")}] ${config.name} is Already!`.green);
        } else {
            console.log(data.green);
            console.log(`[${moment().tz(config.timezone).format("HH:mm:ss")}] ${config.name} is Already!`.green);
        }
    });
});

const checkIfKeyExist = (objectName, keyName) => {
    let keyExist = Object.keys(objectName).some((key) => key === keyName);
    return keyExist;
};

async function getAnimeQuotes(param) {
    try {
        let url = "https://animechan.vercel.app/api/random";
        if (checkIfKeyExist(param, "character") || checkIfKeyExist(param, "title")) {
            let character = param.character ?? "";
            let title = param.title ?? "";
            console.log(title, character);
            if (title != "") {
                url = `https://animechan.vercel.app/api/random/anime?title=${title}`;
            } else if (character != "") {
                url = `https://animechan.vercel.app/api/random/character?name=${character}`;
            } else {
                url = "https://animechan.vercel.app/api/random";
            }
        }

        console.log(url);
        const response = await fetch(url);
        const quote = await response.json();

        return quote;
    } catch (err) {
        console.error(err);
    }
}

// client.on("message", (message) => {});

client.on("message", async (message) => {
    const isGroups = message.from.endsWith("@g.us") ? true : false;
    const admins = ["6281234567890"];
    let messageBody = message.body.toLowerCase();
    if ((isGroups && config.groups) || !isGroups) {
        if (message.type == "image" || message.type == "video" || message.type == "gif") {
            if (messageBody == "!stiker") {
                // client.sendMessage(message.from, "*[⏳]*");
                console.log(message.from + " | " + "loading...");
                try {
                    const media = await message.downloadMedia();
                    client
                        .sendMessage(message.from, media, {
                            sendMediaAsSticker: true,
                            stickerName: config.name,
                            stickerAuthor: config.author,
                        })
                        .then(() => {
                            // client.sendMessage(message.from, "*[✅]* Successfully!");
                            logService.writeLog(message.author + " | " + "sticker created.");
                        });
                } catch (err) {
                    client.sendMessage(message.from, "*[❌]* Failed!");
                    console.log(err);
                }
            }
        } else if (message.type == "sticker") {
            // client.sendMessage(message.from, "*[⏳]* Sabar ya..");
            // try {
            //     const media = await message.downloadMedia();
            //     client.sendMessage(message.from, media).then(() => {
            //         // client.sendMessage(message.from, "*[✅]* Successfully!");
            //     });
            // } catch {
            //     client.sendMessage(message.from, "*[❌]* Failed!");
            // }
        } else if (message.type == "chat") {
            if (messageBody === "!ping") {
                client.sendMessage(message.from, "pong");
                logService.writeLog(message.from + " || " + message.type);
            } else if (messageBody.includes("!animequotes")) {
                // splittedTxt = messageBody.split(" ");

                let title = "";
                let character = "";
                // for (let i = 1; i < splittedTxt.length; i++) {
                //     if (splittedTxt[i].includes("title:")) {
                //         title = splittedTxt[i].replace("title:", "");
                //     }

                //     if (splittedTxt[i].includes("character:")) {
                //         character = splittedTxt[i].replace("character:", "");
                //     }
                // }
                if (messageBody.includes("title:")) title = messageBody.replace("!animequotes title:", "");
                else if (messageBody.includes("character:")) character = messageBody.replace("!animequotes character:", "");

                getAnimeQuotes({
                    title: title,
                    character: character,
                }).then((quote) => {
                    if (quote.error) {
                        client.sendMessage(message.from, quote.error);
                        logService.writeLog(JSON.stringify({ from: message.from, quote: quote }));
                        return;
                    }

                    client.sendMessage(message.from, `${quote.quote}\n\n~ *${quote.character}* from _${quote.anime}_`);
                    logService.writeLog(JSON.stringify({ from: message.from, quote: quote }));
                });
            } else if (messageBody.includes("@all") && isGroups) {
                if (admins.includes(message.author.split("@")[0])) {
                    const chat = await message.getChat();

                    let text = "";
                    let mentions = [];
                    let canSend = false;

                    for (let participant of chat.participants) {
                        const contact = await client.getContactById(participant.id._serialized);

                        canSend = true;
                        mentions.push(contact);
                        text += `@${participant.id.user} `;
                    }

                    await chat.sendMessage(text, { mentions });
                }
            }
        } else {
            client.getChatById(message.id.remote).then(async (chat) => {
                await chat.sendSeen();
            });
        }
    }
});

client.initialize();
