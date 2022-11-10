import axios from "axios";
import { config } from "dotenv";
import express from "express";
import {GoogleSpreadSheet} from ''

config()
const app = express()

const JOKE_API = "https://v2.jokeapi.dev/joke/Programming?type=single";
const TELEGRAM_URI = "https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage";

app.use(express.json())
app.use(
    express.urlencoded({
        extended: true
    })
);

const doc = new GoogleSpreadSheet(process.env.GOOGLE_SPREADSHEET_ID);
await doc.useServiceAccountAuth({
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
});

app.post('/newMessage', async (req, res) => {
    const { message } = req.body

    const messageText = message?.text?.toLowerCase()?.trim()
    const chatId = message?.chat?.id

    if (!messageText || chatId) {
        return res.sendStatus(400)
    }

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    const dataFromSpreadSheet = rows.reduce((obj, row) => {
        if (row.date) {
            const todo = {text: row.text, done: row.done}
            obj[row.date] = obj[row.date] ? [...obj[row.date], todo] : [todo]
        }
        return obj
    }, {});

    let responseText = 'ОЛЬГА';

    if (messageText === 'Ольга') {
        try {
            responseText = "Кирилл злоебучий пиздосрал"
        }  catch (e) {
            console.log(e)
            res.send(e)
        }
    } else if (/\d\d\.\d\d/.test(messageText)) {
        responseText = dataFromSpreadSheet[messageText] || 'АААААААААААААААААААА'
    }

    try {
        await axios.post(TELEGRAM_URI, {
            chatId: chatId,
            text: responseText
        })
        res.send('Done')
    }
    catch (e) {
        console.log(e)
        res.send(e)
    }

    try {
        await axios.post(TELEGRAM_URI, {})
    } catch (e) {
        console.log(e)
        res.send(e)
    }
});

const PORT = proccess.env.PORT || 4444;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту : ${PORT}`)
});

