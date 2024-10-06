import { AutocompleteInteraction, Client } from "discord.js"
import prisma, { PodcastSatus } from "../database/prismaClient.js"

/**
 * 
 * @param {AutocompleteInteraction} interaction 
 * @param {Client} client 
 */
async function handleAutocomplete(interaction, client) {
    const focusedOption = interaction.options.getFocused(true);
    var choices = [];

    let paused = { name: "Pause", value: "paused", name_localizations: { "es-ES": "Pausar", "es-419": "Pausar" } }
    let active = { name: "Start", value: "active", name_localizations: { "es-ES": "Iniciar", "es-419": "Iniciar" } }
    let resume = { name: "Resume", value: "active", name_localizations: { "es-ES": "Reanudar", "es-419": "Reanudar" } }
    let inactive = { name: "End", value: "inactive", name_localizations: { "es-ES": "Terminar", "es-419": "Terminar" } }

    if (focusedOption.name === 'podcast') {
        let podcasts = await getPodcasts(interaction.guildId)
        choices = await processPodcasts(podcasts, client)
    }

    if (focusedOption.name === 'action') {
        let podcast = interaction.options.getString('podcast');
        if (podcast && !isNaN(podcast)) {
            let status = await getPodcastStatus(podcast, client)
            switch (status) {
                case PodcastSatus.ACTIVE:
                    choices.push(paused)
                    choices.push(inactive)
                    break
                case PodcastSatus.INACTIVE:
                    choices.push(active)
                    break
                case PodcastSatus.PAUSED:
                    choices.push(resume)
                    choices.push(inactive)
                    break
            }
        } else {
            choices = []
        }
    }

    const filtered = choices.filter(choice =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
        choice.value.toLowerCase().includes(focusedOption.value.toLowerCase())
    );


    await interaction.respond(filtered)
}

function getPodcasts(guildId) {
    return new Promise(async resolve => {
        const response = await prisma.podcast.findMany({
            where: {
                guild: {
                    discordId: guildId,
                },
            },
            select: {
                id: true,
                status: true,
                stageChannel: {
                    select: {
                        discordId: true
                    }
                },
            },
        });

        resolve(response)
    })
}

function getPodcastStatus(id) {
    return new Promise(async (resolve, reject) => {
        if (!id || id.length == 0 ) reject()
        const response = await prisma.podcast.findUnique({
            where: { id: parseInt(id) },
            select: {
                status: true
            }
        })
        resolve(response.status)
    })
}

function processPodcasts(podcasts, client) {
    return new Promise(async resolve => {
        const filtered_map = await Promise.all(
            podcasts.map(async podcast => {
                // Obtener el nombre del canal usando la función `getChannelNameById` mejorada
                const name = await getChannelNameById(client, podcast.stageChannel.discordId);
                return {
                    name: `(#${podcast.id}) ${name}`,  // Formato "(#idDelPodcast) nombreDelPodcast"
                    value: `${podcast.id}`             // Valor con solo el ID del podcast
                };
            })
        );
        resolve(filtered_map); // Devolver el array con los podcasts en el formato solicitado
    })
}

async function getChannelNameById(client, channelId) {
    try {
        const channel = await Promise.race([
            client.channels.fetch(channelId),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout fetching channel')), 5000)) // 5 segundos de timeout
        ]);
        
        if (!channel) {
            throw new Error('Canal no encontrado');
        }
        return channel.name; // Devuelve el nombre del canal
    } catch (error) {
        console.error(`Error al obtener el nombre del canal para el ID ${channelId}:`, error);
        return 'Canal desconocido'; // Devuelve un nombre genérico en caso de error
    }
}

export default handleAutocomplete