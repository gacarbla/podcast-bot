import { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder } from '@discordjs/builders';
import prisma, { PodcastSatus } from '../database/prismaClient.js';
import { ChatInputCommandInteraction, PermissionFlagsBits, ButtonStyle } from 'discord.js';
import send from '../utils/send.js';
import podcast_times from '../utils/times.js';

const podcastCommand = {
    data: new SlashCommandBuilder()
        .setName('podcast')
        .setDescription('Gestiona tu podcast')
        .addStringOption(option =>
            option
                .setName('podcast')
                .setDescription('Selecciona el podcast para gestionar')
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('action')
                .setNameLocalizations({
                    "es-ES": "acción",
                    "es-419": "acción"
                })
                .setDescription('La acción a realizar')
                .setAutocomplete(true)
                .setRequired(true)
        ),

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     * @returns 
     */
    async execute(interaction, client) {
        const podcastId = parseInt(interaction.options.getString('podcast'));
        const action = interaction.options.getString('action');
        const userId = interaction.user.id;

        // Buscar el podcast asignado al usuario en el servidor actual
        const podcast = await prisma.podcast.findUnique({
            where: {
                id: podcastId
            },
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
                }
            }
        });

        if (!podcast) return interaction.reply({ content: 'Vaya, hubo un error y no se ha podido conectar con el podcast...', ephemeral: true });
        const chat = interaction.guild.channels.cache.find(ch => ch.id === podcast.chatChannelId);
        const audienceRole = interaction.guild.roles.cache.find(role => role.id === podcast.audienceRoleId)
        const podcasters = podcast.podcasters
        if (podcasters.length > 0) {
            let idmap = podcasters.map(p => p.discordId)
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && !idmap.includes(userId))
                return await interaction.reply({ content: "No puedes alterar el estado de un podcast si no eres podcaster o moderador.", ephemeral: true })
        }

        switch (action) {
            case "paused":
                var response = await prisma.podcast.update({
                    where: { id: podcastId },
                    data: {
                        status: PodcastSatus.PAUSED
                    }
                })

                const blockbutton = new ButtonBuilder()
                    .setCustomId('block_chat')
                    .setLabel('Bloquear')
                    .setStyle(ButtonStyle.Primary);

                if (!response || response.status != PodcastSatus.PAUSED) return error(interaction)
                send.log(podcast, "status", `Podcast #${podcast.id} pausado`, `<@${interaction.user.id}> ha pausado el podcast`, interaction.guild)
                await interaction.reply({ content: "El podcast  se ha pausado. ¿Quieres bloquear el chat temporalmente?", ephemeral: true, components: [new ActionRowBuilder().addComponents(blockbutton)] })

                // Esperar la interacción del usuario
                const filter = (i) => i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

                collector.on('collect', async (i) => {
                    if (i.customId === 'block_chat') {
                        await setChannelPermission(chat, audienceRole, false)
                        send.log(podcast, "actions", "Canal bloqueado", `<@${interaction.user.id}> ha bloqueado el canal <#${podcast.chatChannelId}>`, interaction.guild)
                        await i.update({ content: 'Canal bloqueado.', components: [] });
                        collector.stop();
                    }
                });

                collector.on('end', async (collected, reason) => {
                    if (reason === 'time') {
                        await interaction.editReply({
                            content: 'El tiempo para responder ha expirado.',
                            components: [
                                new ActionRowBuilder().addComponents(blockbutton.setDisabled(true))
                            ]
                        });
                    }
                });

                break
            case "resume":
            case "active":
                var response = await prisma.podcast.update({
                    where: { id: podcastId },
                    data: {
                        status: PodcastSatus.ACTIVE
                    }
                })
                if (!response || response.status != PodcastSatus.ACTIVE) return error(interaction)
                await setChannelPermission(chat, audienceRole, true)
                send.log(podcast, "status", `Podcast #${podcast.id} iniciado`, `<@${interaction.user.id}> ha ${action=="active"?"iniciado":"reanudado"} el podcast.`, interaction.guild)
                .catch(()=>{});
                send.log(podcast, "actions", "Canal desbloqueado", `<@${interaction.user.id}> ha desbloqueado el canal <#${podcast.chatChannelId}>`, interaction.guild)
                .catch(()=>{});
                podcast_times.set(podcast.id, 'active')
                await interaction.reply({ content: "El podcast ha iniciado.", ephemeral: true })
                break
            case "inactive":
                var response = await prisma.podcast.update({
                    where: { id: podcastId },
                    data: {
                        status: PodcastSatus.INACTIVE
                    }
                })
                if (!response || response.status != PodcastSatus.INACTIVE) return error(interaction)
                await setChannelPermission(chat, audienceRole, false)
                send.log(podcast, "status", `Podcast #${podcast.id} finalizado`, `<@${interaction.user.id}> ha finalizado el podcast`, interaction.guild)
                .catch(()=>{});
                send.log(podcast, "actions", "Canal bloqueado", `<@${interaction.user.id}> ha bloqueado el canal <#${podcast.chatChannelId}>`, interaction.guild)
                .catch(()=>{});
                const time = podcast_times.set(podcast.id, 'inactive')
                send.log(podcast, "other", `Tiempo de podcast #${podcast.id}`, `El podcast ha finalizado con ${time} minutos de actividad`, interaction.guild)
                .catch(()=>{});
                await interaction.reply({ content: "El podcast ha finalizado.", ephemeral: true })
                break
            default:
                await interaction.reply({ content: "No tenemos ni idea de qué opción has seleccionado..." })
        }
    },
};

const setChannelPermission = (channel, role, canWrite) => {
    return new Promise(async resolve => {
        await channel.permissionOverwrites.edit(role, {
            SendMessages: canWrite
        })
        resolve()
    })
};

/**
 * 
 * @param {ChatInputCommandInteraction} i 
 */
function error(i) {
    i.reply({ content: "Ha surgido un error al guardar el estado en la base de datos", ephemeral: true })
}

export default podcastCommand