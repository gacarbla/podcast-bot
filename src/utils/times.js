import { Client } from "discord.js";
import prisma from "../database/prismaClient.js";
import send from "./send.js";

const podcastTimes = {};

// Guardar los hitos que ya han sido alcanzados para evitar imprimir repetidamente
const podcastTimeMilestones = {};

/**
 * Función para actualizar el tiempo activo del podcast al cambiar su estado
 * @param {number} podcastId
 * @param {string} newStatus
 */
function updatePodcastTime(podcastId, newStatus) {
    const currentTime = Date.now();

    if (!podcastTimes[podcastId]) {
        podcastTimes[podcastId] = {
            totalActiveTime: 0,
            lastActiveTimestamp: null,
            currentStatus: "inactive",
        };
    }

    const podcast = podcastTimes[podcastId];

    if (newStatus === "active") {
        if (podcast.currentStatus !== "active") {
            podcast.lastActiveTimestamp = currentTime;
        }
    } else if (newStatus === "paused") {
        if (podcast.currentStatus === "active" && podcast.lastActiveTimestamp) {
            const timeActiveNow = currentTime - podcast.lastActiveTimestamp;
            podcast.totalActiveTime += timeActiveNow;
            podcast.lastActiveTimestamp = null;
        }
    } else if (newStatus === "inactive") {
        if (podcast.currentStatus === "active" && podcast.lastActiveTimestamp) {
            const timeActiveNow = currentTime - podcast.lastActiveTimestamp;
            podcast.totalActiveTime += timeActiveNow;
            podcast.lastActiveTimestamp = null;
        }
        podcastTimes[podcastId] = undefined;
        return Math.floor(podcast.totalActiveTime / 60000);
    }
    podcast.currentStatus = newStatus;
}

/**
 * Función para obtener el tiempo total activo del podcast
 * @param {number} podcastId
 * @returns {number}
 */
function getPodcastActiveTime(podcastId) {
    const podcast = podcastTimes[podcastId];
    if (!podcast) return 0;

    const currentTime = Date.now();
    let totalActiveTime = podcast.totalActiveTime;

    if (podcast.currentStatus === "active" && podcast.lastActiveTimestamp) {
        const timeActiveNow = currentTime - podcast.lastActiveTimestamp;
        totalActiveTime += timeActiveNow;
    }

    return Math.floor(totalActiveTime / 1000);
}

/**
 * Función que verifica y emite log si el podcast ha alcanzado los hitos
 * @param {number} podcastId
 * @param {Client} client - El objeto client de Discord.js
 */
async function checkMilestones(podcastId, client) {
    const milestones = [1, 45, 60, 90, 120, 150]; // Minutos a verificar
    const podcastMilestones = podcastTimeMilestones[podcastId] || {};

    const activeTimeInMinutes = Math.floor(getPodcastActiveTime(podcastId) / 60); // Convertimos de segundos a minutos

    for (const milestone of milestones) {
        if (activeTimeInMinutes >= milestone && !podcastMilestones[milestone]) {
            const podcast = await prisma.podcast.findUnique({
                where: { id: parseInt(podcastId) },
                select: {
                    id: true,
                    logsChannelId: true,
                    announcementChannelId: true,
                    currentHosterId: true,
                    chatChannelId: true,
                    audienceRoleId: true,
                    podcasters: {
                        select: {
                            discordId: true
                        }
                    },
                    guildId: true
                }
            });
            send.warning(podcast, `El podcast ${podcast.id} ha alcanzado los ${milestone} minutos de actividad.`, client.guilds.resolve(podcast.guildId))
                .catch(()=>{});
            podcastMilestones[milestone] = true; // Marcamos el hito como alcanzado
        }
    }

    podcastTimeMilestones[podcastId] = podcastMilestones;
}

/**
 * Ejecutar la verificación de hitos cada 60 segundos para todos los podcasts activos
 * @param {Client} client - El objeto client de Discord.js
 */
function startMilestoneChecker(client) {
    setInterval(() => {
        Object.keys(podcastTimes).forEach((podcastId) => {
            try {
                if (podcastTimes[podcastId].currentStatus === "active") {
                    checkMilestones(podcastId, client);
                }
            } catch (e) {
                console.error(e)
            }
        });
    }, 60000); // Verificación cada 60 segundos
}

const podcast_times = {
    set: updatePodcastTime,
    get: getPodcastActiveTime,
    startChecker: startMilestoneChecker
};

export default podcast_times;
export { podcastTimes, updatePodcastTime, getPodcastActiveTime, checkMilestones, startMilestoneChecker };
