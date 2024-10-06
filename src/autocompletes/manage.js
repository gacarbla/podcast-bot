import prisma from "../database/prismaClient.js"

async function handleManageAutocomplete(interaction, client) {
    const focusedOption = interaction.options.getFocused(true);
    let choices;

    if (focusedOption.name === 'podcast') {
        choices = await getPodcastsFromDatabase(interaction.guild.id, client);
    }

    const filtered = choices.filter(choice => 
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
        choice.value.toLowerCase().includes(focusedOption.value.toLowerCase())
    );
    

    await interaction.respond(filtered)
}

// Función para obtener la lista de podcasts desde la base de datos
async function getPodcastsFromDatabase(guildId, client) {
    return new Promise(async resolve => {
        const podcasts = await prisma.podcast.findMany({
            where: {
                guild: {
                    discordId: guildId,  // Filtra por el discordId del servidor
                },
            },
            select: {
                id: true,         // Selecciona el ID del podcast
                stageChannel: {   // Selecciona el ID del canal del podcast
                    select: {
                        discordId: true // Selecciona el discordId del canal de escenario
                    }
                },
            },
        });
    
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

export default handleManageAutocomplete