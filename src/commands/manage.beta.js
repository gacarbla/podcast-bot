import { SlashCommandBuilder } from '@discordjs/builders';
import { ActionRowBuilder, UserSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import prisma from '../database/prismaClient.js';

const manageCommand = {
    data: new SlashCommandBuilder()
        .setName('manage')
        .setDescription('Gestiona podcasts')
        .addSubcommand(sub =>
            sub
                .setName('edit')
                .setDescription('Edita un podcast existente')
                .addStringOption(option =>
                    option.setName('podcast')
                        .setDescription('Selecciona el podcast a editar')
                        .setAutocomplete(true)
                        .setRequired(true)
                )
        ),

    /**
     * @param { ChatInputCommandInteraction } interaction
     */
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const podcastId = interaction.options.getString('podcast', true);

        if (subcommand === 'edit') {
            const podcast = await prisma.podcast.findFirst({
                where: { id: parseInt(podcastId) },
                select: {
                    id: true,
                    stageChannelId: true,
                    podcasters: true
                }
            });

            if (!podcast) {
                return interaction.reply({ content: 'El podcast no existe.', ephemeral: true });
            }

            // Número actual de podcasters
            const currentPodcasters = podcast.podcasters.map(p => p.discordId);
            const podcastersCount = currentPodcasters.length;

            const maxToAdd = 25 - podcastersCount;

            // Mostrar embed con los podcasters actuales
            const embed = new EmbedBuilder()
                .setTitle('Editar Podcasters')
                .setDescription('Aquí puedes añadir o eliminar podcasters de este podcast.')
                .addFields([
                    { name: 'Podcasters actuales', value: currentPodcasters.length > 0 ? `<@${currentPodcasters.join('> <@')}>` : '*No hay podcasters asignados*' },
                    { name: 'Número de podcasters', value: `${podcastersCount} / 25` }
                ]);

            // Crear el UserSelect para añadir podcasters
            const addPodcastersSelect = new UserSelectMenuBuilder()
                .setCustomId('add_podcasters')
                .setPlaceholder('Selecciona podcasters para añadir')
                .setMinValues(1)
                .setMaxValues(maxToAdd);

            // Crear el StringSelect para eliminar podcasters (si los hay)
            const removePodcastersSelect = new StringSelectMenuBuilder()
                .setCustomId('remove_podcasters')
                .setPlaceholder('Selecciona podcasters para eliminar')
                .setMinValues(1)
                .setMaxValues(currentPodcasters.length)
                .setOptions(
                    currentPodcasters.map(p => ({
                        label: `@${p}`,
                        value: p
                    }))
                );

            const addRow = new ActionRowBuilder().addComponents(addPodcastersSelect);
            const removeRow = new ActionRowBuilder().addComponents(removePodcastersSelect);

            await interaction.reply({ embeds: [embed], components: [addRow, removeRow], ephemeral: true });

            // Configurar el colector para manejar la selección
            const filter = (i) => i.user.id === interaction.user.id;
            let collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                if (i.customId === 'add_podcasters') {
                    const selectedUsers = i.values;

                    // Agregar los podcasters seleccionados
                    await prisma.podcast.update({
                        where: { id: podcast.id },
                        data: {
                            podcasters: {
                                connect: selectedUsers.map(discordId => ({ discordId }))
                            }
                        }
                    });

                    // Actualizar el mensaje y reiniciar el colector
                    await updateMessage(interaction, podcast.id);
                    collector.resetTimer();
                } else if (i.customId === 'remove_podcasters') {
                    const selectedUsers = i.values;

                    // Eliminar los podcasters seleccionados
                    await prisma.podcast.update({
                        where: { id: podcast.id },
                        data: {
                            podcasters: {
                                disconnect: selectedUsers.map(discordId => ({ discordId }))
                            }
                        }
                    });

                    // Actualizar el mensaje y reiniciar el colector
                    await updateMessage(interaction, podcast.id);
                    collector.resetTimer();
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await interaction.editReply({
                        content: 'El tiempo para editar podcasters ha expirado.',
                        components: [
                            new ActionRowBuilder().addComponents(addPodcastersSelect.setDisabled(true)),
                            new ActionRowBuilder().addComponents(removePodcastersSelect.setDisabled(true))
                        ]
                    });
                }
            });
        }
    }
};

/**
 * Función para actualizar el mensaje con los podcasters actuales.
 * @param {ChatInputCommandInteraction} interaction
 * @param {number} podcastId
 */
async function updateMessage(interaction, podcastId) {
    const podcast = await prisma.podcast.findFirst({
        where: { id: podcastId },
        select: {
            id: true,
            podcasters: true
        }
    });

    const currentPodcasters = podcast.podcasters.map(p => p.discordId);
    const podcastersCount = currentPodcasters.length;
    const maxToAdd = 25 - podcastersCount;

    // Actualizar el embed
    const embed = new EmbedBuilder()
        .setTitle('Editar Podcasters')
        .setDescription('Aquí puedes añadir o eliminar podcasters de este podcast.')
        .addFields([
            { name: 'Podcasters actuales', value: currentPodcasters.length > 0 ? `<@${currentPodcasters.join('> <@')}>` : '*No hay podcasters asignados*' },
            { name: 'Número de podcasters', value: `${podcastersCount} / 25` }
        ]);

    // Crear el UserSelect para añadir podcasters
    const addPodcastersSelect = new UserSelectMenuBuilder()
        .setCustomId('add_podcasters')
        .setPlaceholder('Selecciona podcasters para añadir')
        .setMinValues(1)
        .setMaxValues(maxToAdd);

    // Crear el StringSelect para eliminar podcasters (si los hay)
    const removePodcastersSelect = new StringSelectMenuBuilder()
        .setCustomId('remove_podcasters')
        .setPlaceholder('Selecciona podcasters para eliminar')
        .setMinValues(1)
        .setMaxValues(currentPodcasters.length)
        .setOptions(
            currentPodcasters.map(p => ({
                label: `@${p}`,
                value: p
            }))
        );

    const addRow = new ActionRowBuilder().addComponents(addPodcastersSelect);
    const removeRow = new ActionRowBuilder().addComponents(removePodcastersSelect);

    await interaction.editReply({ embeds: [embed], components: [addRow, removeRow], ephemeral: true });
}

export default manageCommand;
