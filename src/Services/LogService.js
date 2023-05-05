const fs = require("fs");
const dateObj = new Date();

class LogService {
    constructor() {
        this.date = ("0" + dateObj.getDate()).slice(-2);
        this.month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
        this.year = dateObj.getFullYear();
        this.hours = dateObj.getHours();
        this.minutes = dateObj.getMinutes();
        this.seconds = dateObj.getSeconds();

        this.path = `./logs/${this.year}-${this.month}-${this.date}.log`;

        fs.access(this.path, fs.F_OK, (err) => {
            if (err) {
                fs.writeFile(this.path, `[${this.hours}:${this.minutes}:${this.seconds}]  Log file created!`, function (err) {
                    console.log("A new log file was created successfully.");
                });
                console.error(err);
            }
        });
    }

    writeLog(message) {
        if (message == "") {
            console.log("message can not empty!");
            return;
        }

        fs.appendFile(this.path, `[${this.hours}:${this.minutes}:${this.seconds}] ${message}\n`, function (err) {});
    }
}

module.exports = LogService;
