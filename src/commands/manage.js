import { SlashCommandBuilder, StringSelectMenuBuilder } from '@discordjs/builders';
import { ActionRowBuilder, UserSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, StringSelectMenuOptionBuilder, Collector } from 'discord.js';
import prisma, { PodcastSatus } from '../database/prismaClient.js';
import { fetchUsername } from '../utils/fetch.js';

const manageCommand = {
    data: new SlashCommandBuilder()
        .setName('manage')
        .setDescription('Gestiona podcasts')
        .addSubcommandGroup(group =>
            group
                .setName('podcast')
                .setDescription('Comandos para gestionar podcasts')
                .addSubcommand(sub =>
                    sub
                        .setName('add')
                        .setDescription('Crea un nuevo podcast en el servidor')
                        .addChannelOption(option =>
                            option.setName('stage')
                                .setNameLocalizations({
                                    "es-ES": "escenario",
                                    "es-419": "escenario"
                                })
                                .setDescription('Canal de escenario asociado')
                                .setRequired(true)
                                .addChannelTypes(13)
                        )
                        .addChannelOption(option =>
                            option.setName('chat')
                                .setDescription('Canal de texto para la audiencia')
                                .setRequired(true)
                                .addChannelTypes(0)
                        )
                        .addRoleOption(option =>
                            option.setName('role')
                                .setNameLocalizations({
                                    "es-ES": "rol",
                                    "es-419": "rol"
                                })
                                .setDescription('Rol que identifica a la audiencia')
                                .setRequired(true)
                        )
                        .addChannelOption(option =>
                            option.setName('logs')
                                .setDescription('Canal opcional para registrar los logs del podcast')
                                .setRequired(false)
                                .addChannelTypes(0)
                        )
                        .addChannelOption(option =>
                            option.setName('announcements')
                                .setNameLocalizations({
                                    "es-ES": "anuncios",
                                    "es-419": "anuncios"
                                })
                                .setDescription('Canal opcional para anuncios, pings, etc...')
                                .setRequired(false)
                                .addChannelTypes(0)
                        )
                        .addChannelOption(option =>
                            option.setName('contact')
                                .setNameLocalizations({
                                    "es-ES": "advertencias",
                                    "es-419": "advertencias"
                                })
                                .setDescription('Canal opcional para comunicarse con los podcasters en caso de ser requerido')
                                .setRequired(false)
                                .addChannelTypes(0)
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('delete')
                        .setDescription('Elimina un podcast existente')
                        .addStringOption(option =>
                            option.setName('podcast')
                                .setDescription('Selecciona el podcast a eliminar')
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('info')
                        .setDescription('Obtén la información de un podcast')
                        .addStringOption(option =>
                            option.setName('podcast')
                                .setDescription('Selecciona el podcast a visualizar')
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('channels')
                        .setDescription('Obtén, edita o elimina configuraciones de canales')
                        .addStringOption(option =>
                            option.setName('podcast')
                                .setDescription('Selecciona el podcast a editar')
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('action')
                                .setNameLocalizations({
                                    "es-ES": "acción",
                                    "es-419": "acción"
                                })
                                .setDescription('¿Qué acción quieres llevar a cabo?')
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('channel')
                                .setNameLocalizations({
                                    "es-ES": "canal",
                                    "es-419": "canal"
                                })
                                .setDescription('Indica el canal deseado')
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('podcasters')
                        .setDescription('Obtén, edita o elimina configuraciones de podcasters')
                        .addStringOption(option =>
                            option.setName('podcast')
                                .setDescription('Selecciona el podcast a editar')
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('action')
                                .setNameLocalizations({
                                    "es-ES": "acción",
                                    "es-419": "acción"
                                })
                                .setDescription('¿Qué acción quieres llevar a cabo?')
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('target')
                                .setNameLocalizations({
                                    "es-ES": "objetivo",
                                    "es-419": "objetivo"
                                })
                                .setDescription('Indica el usuario o rol deseado')
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
        ),

    /**
     * @param { ChatInputCommandInteraction } interaction
     */
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        const guild = interaction.guild;

        if (subcommand === 'add') {


            // Obtener canales
            const stageChannel = interaction.options.getChannel('stage');
            const textChannel = interaction.options.getChannel('chat');
            const logsChannel = interaction.options.getChannel('logs');
            const announcementsChannel = interaction.options.getChannel('announcements');
            const warningsChannel = interaction.options.getChannel('contact');
            const audienceRole = interaction.options.getRole('role')

            // Asegurarse de que los canales existen en la base de datos
            const channelsToUpsert = [
                { id: stageChannel.id, name: stageChannel.name },
                { id: textChannel.id, name: textChannel.name },
            ];

            if (logsChannel) {
                channelsToUpsert.push({ id: logsChannel.id, name: logsChannel.name });
            }

            if (announcementsChannel) {
                channelsToUpsert.push({ id: announcementsChannel.id, name: announcementsChannel.name });
            }

            if (warningsChannel) {
                channelsToUpsert.push({ id: warningsChannel.id, name: warningsChannel.name });
            }

            for (const channel of channelsToUpsert) {
                await prisma.channel.upsert({
                    where: { discordId: channel.id },
                    update: {},
                    create: {
                        discordId: channel.id
                    },
                });
            }

            const exist = await prisma.podcast.findFirst({
                where: {
                    stageChannel: {
                        discordId: stageChannel.id
                    }
                }
            });

            if (exist) return interaction.reply({ content: `Este canal de escenario ya ha sido asignado al podcast #${exist.id}`, ephemeral: true })


            // Crear el podcast y conectarlo al servidor existente
            const podcast = await prisma.podcast.create({
                data: {
                    guild: {
                        connect: { discordId: guildId },
                    },
                    audienceRoleId: audienceRole.id,
                    stageChannel: {
                        connect: { discordId: stageChannel.id },
                    },
                    chatChannel: {
                        connect: { discordId: textChannel.id },
                    },
                    timeLogsChannel: warningsChannel ? {
                        connect: { discordId: warningsChannel.id }
                    } : undefined,
                    announcementChannel: announcementsChannel ? {
                        connect: { discordId: announcementsChannel.id }
                    } : undefined,
                    logsChannel: logsChannel ? {
                        connect: { discordId: logsChannel.id }
                    } : undefined
                },
            });

            // Crear un embed y componentes para seleccionar podcasters
            const embed = new EmbedBuilder()
                .setTitle('Selecciona Podcasters')
                .setDescription('Selecciona los usuarios que serán asignados como podcasters para este podcast.');

            const selectMenu = new UserSelectMenuBuilder()
                .setCustomId('select_podcasters')
                .setPlaceholder('Selecciona podcasters')
                .setMinValues(1)
                .setMaxValues(20);

            const skipButton = new ButtonBuilder()
                .setCustomId('skip_podcasters')
                .setLabel('Saltar')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            const buttonRow = new ActionRowBuilder().addComponents(skipButton);

            await interaction.reply({ embeds: [embed], components: [row, buttonRow], ephemeral: true });

            // Esperar la interacción del usuario
            const filter = (i) => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                if (i.customId === 'select_podcasters') {
                    const selectedUsers = i.values;

                    const promises = selectedUsers.map(async discordId => {
                        await prisma.user.upsert({
                            where: { discordId: discordId },
                            update: {},  // No necesitamos actualizar nada si ya existe
                            create: {
                                discordId: discordId,  // Crear el usuario si no existe
                            },
                        });
                    });

                    // Esperar a que todas las promesas se resuelvan
                    await Promise.all(promises);

                    // Paso 2: Conectar los usuarios (ahora existentes) al podcast
                    await prisma.podcast.update({
                        where: { id: podcast.id },
                        data: {
                            podcasters: {
                                connect: selectedUsers.map(discordId => ({ discordId })),  // Conectar por discordId
                            },
                        },
                    });
                    await i.update({ content: 'Podcasters asignados correctamente.', components: [], embeds: [] });
                    collector.stop();
                } else if (i.customId === 'skip_podcasters') {
                    await i.update({ content: 'Podcast creado sin podcasters asignados.', components: [], embeds: [] });
                    collector.stop();
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await interaction.editReply({
                        content: 'El tiempo para responder ha expirado.',
                        components: [
                            new ActionRowBuilder().addComponents(selectMenu.setDisabled(true)),
                            new ActionRowBuilder().addComponents(skipButton.setDisabled(true))
                        ]
                    });
                }
            });

        } else if (subcommand === 'delete') {
            const podcastId = interaction.options.getString('podcast', true);

            const podcast = await prisma.podcast.findFirst({
                where: { id: parseInt(podcastId) },
                select: {
                    id: true,
                    stageChannelId: true,
                    stageChannel: true,
                    podcasters: true,
                    status: true
                }
            });

            if (!podcast) {
                return interaction.reply({ content: 'El podcast no existe.', ephemeral: true });
            }

            if (podcast.status == "ACTIVE") return interaction.reply({ content: "No se puede eliminar un podcast activo", ephemeral: true })

            let podcasters = podcast.podcasters.length > 0 ? "<@" + podcast.podcasters.map(e => `${e.discordId}`).join("> <@") + ">" : "*No designados*"

            // Mostrar embed de confirmación
            const embed = new EmbedBuilder()
                .setTitle(`Eliminar Podcast`)
                .setDescription('Estás a punto de eliminar un podcast definitivamente.\nNo se podrá recuperar de ninguna forma.\n\n** **')
                .addFields([
                    { name: "ID", value: `\`#${podcast.id}\``, inline: true },
                    { name: "Canal de podcast", value: `<#${podcast.stageChannelId}>`, inline: true },
                    {
                        name: "Podcasters",
                        value: podcasters
                    }
                ]);

            const deleteButton = new ButtonBuilder()
                .setCustomId('confirm_delete')
                .setLabel('Eliminar')
                .setStyle(ButtonStyle.Danger);

            const cancelButton = new ButtonBuilder()
                .setCustomId('cancel_delete')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(deleteButton, cancelButton);

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

            // Esperar la interacción del usuario
            const filter = (i) => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                if (i.customId === 'confirm_delete') {
                    await prisma.podcast.delete({ where: { id: podcast.id } });
                    await i.update({ content: 'Podcast eliminado correctamente.', components: [], embeds: [] });
                    collector.stop();
                } else if (i.customId === 'cancel_delete') {
                    await i.update({ content: 'Operación cancelada.', components: [], embeds: [] });
                    collector.stop();
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    const disabledRow = new ActionRowBuilder().addComponents(
                        deleteButton.setDisabled(true),
                        cancelButton.setDisabled(true)
                    );
                    await interaction.editReply({ content: 'El tiempo para responder ha expirado.', components: [disabledRow] });
                }
            });

        } else if (subcommand === 'info') {
            const podcastId = interaction.options.getString('podcast', true);

            const podcast = await prisma.podcast.findFirst({
                where: { id: parseInt(podcastId), guildId },
                select: {
                    id: true,
                    stageChannelId: true,
                    stageChannel: true,
                    podcasters: true,
                    status: true,
                    logsChannelId: true,
                    timeLogsChannelId: true,
                    announcementChannelId: true
                }
            });

            if (!podcast) {
                return interaction.reply({ content: 'El podcast no existe.', ephemeral: true });
            }

            const currentPodcasters = podcast.podcasters.map(p => p.discordId);
            const podcastersCount = currentPodcasters.length;

            // Mostrar embed de confirmación
            const embed = new EmbedBuilder()
                .setTitle(`Información del Podcast`)
                .setDescription('Estás viendo la configuración del podcast.\nSi quieres modificar alguno de los ajustes, selecciona el botón con el mismo icono.\n\n' + ((podcast.status != PodcastSatus.INACTIVE) ? "Espera a que el podcast termine para desbloquear todos los ajustes." : ""))
                .addFields([
                    { name: "ID", value: `\`#${podcast.id}\``, inline: true },
                    { name: "Canal de podcast", value: `<#${podcast.stageChannelId}>`, inline: true },
                    { name: "** **", value: "** **" },
                    { name: "Podcasters actuales", value: currentPodcasters.length ? `<@${currentPodcasters.join('> <@')}>` : '*No hay podcasters asignados*', inline: true },
                    { name: "Número de podcasters", value: `${podcastersCount} / 25`, inline: true },
                    { name: "** **", value: "** **" },
                    { name: "Logs", value: podcast.logsChannelId ? `<#${podcast.logsChannelId}>` : "*Sin especificar*", inline: true },
                    { name: "Tiempo", value: podcast.timeLogsChannelId ? `<#${podcast.timeLogsChannelId}>` : "*Sin especificar*", inline: true },
                    { name: "Anuncios", value: podcast.announcementChannelId ? `<#${podcast.announcementChannelId}>` : "*Sin especificar*", inline: true }
                ]);

            await interaction.reply({ embeds: [embed] })
        }
    },
};

export default manageCommand