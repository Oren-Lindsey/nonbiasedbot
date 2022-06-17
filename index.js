import 'dotenv/config'
import { Wasteof2, Wasteof2Auth, Wasteof3 } from 'wasteof-client'
const password = process.env['PASSWORD']
const username = process.env['USERNAME'] || 'nonbiasedbot'
const wasteof = new Wasteof2Auth(username,password)
const commands = ['about', 'all']
await wasteof.login()
wasteof.listen(handleEvent)
async function handleEvent(event) {
    if (event.type == 'updateMessageCount' && event.data !== 0) {
        const messages = await getAllMessages()
        const ids = await getAllMessageIDs(messages)
        await wasteof.markAsRead(ids)
        for (let i = 0; i < messages.length; i++) {
            await respond(messages[i])
        }
    }
}
async function getAllMessages() {
    let last = false
    let msg = []
    for (let i = 1;!last;i++) {
        const current = await wasteof.getUnreadMessages(i)
        last = current.last
        for (let l = 0; l < current.unread.length; l++) {
            msg.push(current.unread[l])
        }
    }
    return msg
}
async function getAllMessageIDs(messages) {
    const ids = []
    for (let i = 0;i<messages.length;i++) {
        ids.push(messages[i]._id)
    }
    return ids
}
async function respond(message) {
    if (message.data.comment.content.split('#')[0] !== message.data.comment.content) {
        if (message.data.actor.name !== username) {
            const command = await getCommand(message.data.comment.content)
            const res = await handleCommand(command.command, command.options)
            await wasteof.postWallComment(username, res, message.data.comment._id)
        }
    } else {
        if (message.data.actor.name !== username) {
            await wasteof.postWallComment(username, `<p>To send a command, you must have a <code>#</code> sign before it!</p>`, message.data.comment._id)
        }
    }
}
async function getCommand(content) {
    const removedHTML = content.split('<p>')[1].split('</p>')[0]
    let split = removedHTML.split('#')
    split.shift()
    const command = split[0]
    split.shift()
    const options = split
    return {command: command, options: options}
}
async function handleCommand(command, options) {
    const commandExists = await checkCommand(command)
    if (commandExists) {
        return await getCommandRes(command, options)
    } else {
        return `<p>Command not found! <code>:(</code>. To get a list of all commands, post #all#commands in my wall</p>`
    }
}
async function getCommandRes(command, options) {
    if (command == 'about' && options[0] == 'this') {
        return `<p>this bot is a wasteof.money bot, made for the non biased org. It's maintained by https://wasteof.money/users/ee. The code is available at: https://github.com/oren-lindsey/nonbiasedbot</p>`
    } else if (command == 'about') {
        return `<p>The Non Biased Org is a non biased organization, created by https://wasteof.money/users/nonbiasednews. For more information, go to @nonbiasedorg.</p>`
    } else if (command == 'all' && options[0] == 'accounts') {
        return `<p>List of Non Biased Org accounts:</p><ul><li>nonbiasedorg (https://wasteof.money/users/nonbiasedorg)</li><li>non-biased-news (https://wasteof.money/users/non-biased-news)</li><li>nonbiasedbot (https://wasteof.money/users/nonbiasedbot)</li><li>nonbiasedart (https://wasteof.money/users/nonbiasedart)</li></ul>`
    } else if (command == 'all' && options[0] == 'commands') {
        return `<p>List of @nonbiasedbot commands:</p><p>(all commands must be preceded by a pound sign, like this: <code>#about</code>. You can include options in commands by adding another pound sign, like this: <code>#about#this</code>)</p><ul><li><p>about: info about the nonbiased organization. options: </p><p>this: returns data about this bot</p></li><li><p>all: gives a list of all the things. options:</p><p>accounts: gives a list of all non biased org accounts</p><p>commands: gives a list of all @nonbiasedbot commands. you probably used it to get this list</p></li></ul>`
    }
}
async function checkCommand(c) {
    if (commands.includes(c)) {
        return true
    } else {
        return false
    }
}