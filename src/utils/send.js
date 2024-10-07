import { Client, Guild } from 'discord.js'
import { EmbedBuilder } from '@discordjs/builders'

/**
 * 
 * @param {*} podcast 
 * @param {"status"|"actions"|"other"} type 
 * @param {string} title
 * @param {string} content 
 * @param {Guild} guild 
 */
function sendLog(podcast, type, title, content, guild) {
    return new Promise(async (resolve, reject) => {
        if (!podcast.logsChannelId) return console.error(new Error("Canal de logs no declarado"))
        const channel = guild.channels.resolve(podcast.logsChannelId)
        if (!channel) return console.error(new Error("Canal de logs no encontrado. ¿Se ha eliminado u ocultado?"))
        var embed = new EmbedBuilder()
            .setDescription(content)
            .setTitle(title)
        switch (type) {
            case "actions":
                embed.setColor(0x5865f2)
                break
            case "other":
                embed.setColor(0x2b2d31)
                break
            case "status":
                embed.setColor(0xfee528)
                break
        }
        resolve(await channel.send({embeds: [embed]}))
    })
}

/**
 * 
 * @param {*} podcast 
 * @param {string} title
 * @param {string} content 
 * @param {Guild} client 
 */
function sendAnnouncement(podcast, title, content, guild) {
    return new Promise(async (resolve, reject) => {
        if (!podcast.announcementChannelId) return console.error(new Error("Canal de anuncios no declarado"))
        const channel = guild.channels.resolve(podcast.announcementChannelId)
        if (!channel) return console.error(new Error("Canal de anuncios no encontrado. ¿Se ha eliminado u ocultado?"))
        var embed = new EmbedBuilder()
            .setDescription(content)
            .setTitle(title)
            .setColor(0x2b2d31)
        resolve(await channel.send({embeds: [embed]}))
    })
}

/**
 * 
 * @param {*} podcast 
 * @param {string} content 
 * @param {Guild} guild 
 */
function sendWarning(podcast, content, guild) {
    return new Promise(async (resolve, reject) => {
        if (!podcast.timeLogsChannelId) return console.error(new Error("Canal de advertencias no declarado"))
        const channel = guild.channels.resolve(podcast.timeLogsChannelId)
        if (!channel) return console.error(new Error("Canal de advertencias no encontrado. ¿Se ha eliminado u ocultado?"))
        var embed = new EmbedBuilder()
            .setDescription(content)
            .setTitle(title)
            .setColor(0xed4245)
        resolve(await channel.send({embeds: [embed]}))
    })
}

/**
 * 
 * @param {*} podcast 
 * @param {string} content 
 * @param {Guild} guild 
 */
function sendMessage(podcast, content, guild) {
    return new Promise(async (resolve, reject) => {
        if (!podcast.chatChannelId) return console.error(new Error("Algo no ha ido como debería..."))
        const channel = guild.channels.resolve(podcast.chatChannelId)
        if (!channel) return console.error(new Error("Canal de chat no encontrado. ¿Se ha eliminado u ocultado?"))
        var embed = new EmbedBuilder()
            .setDescription(content)
            .setTitle(title)
            .setColor(0xed4245)
        resolve(await channel.send({embeds: [embed]}))
    })
}

const send = {
    log: sendLog,
    announcement: sendAnnouncement,
    warning: sendWarning,
    message: sendMessage
}

export default send
export {
    sendLog, sendAnnouncement, sendWarning, sendMessage
}