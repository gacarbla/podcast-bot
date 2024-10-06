import { SlashCommandBuilder } from '@discordjs/builders';
import prisma from '../database/prismaClient.js';

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
                .setName('acción')
                .setDescription('La acción a realizar')
                .addChoices(
                    { name: 'iniciar', value: 'start' },
                    { name: 'detener', value: 'stop' }
                )
                .setRequired(true)
        ),

    async execute(interaction) {
        const podcastName = interaction.options.getString('podcast');
        const action = interaction.options.getString('acción');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        // Buscar el podcast asignado al usuario en el servidor actual
        const podcast = await prisma.podcast.findFirst({
            where: {
                name: podcastName,
                guildId: guildId,
                podcasterId: userId,
            },
        });

        if (!podcast) {
            return interaction.reply({ content: 'No tienes permiso para gestionar este podcast o no existe.', ephemeral: true });
        }

        if (action === 'start') {
            // Lógica para iniciar el podcast
            return interaction.reply(`Has iniciado el podcast: ${podcast.name}`);
        } else if (action === 'stop') {
            // Lógica para detener el podcast
            return interaction.reply(`Has detenido el podcast: ${podcast.name}`);
        }
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        // Obtener los podcasts asignados al usuario en el servidor actual
        const podcasts = await prisma.podcast.findMany({
            where: {
                guildId: guildId,
                podcasterId: userId,
                name: {
                    contains: focusedValue,
                    mode: 'insensitive',
                },
            },
            take: 25,
        });

        const choices = podcasts.map(podcast => ({
            name: podcast.name,
            value: podcast.name,
        }));

        await interaction.respond(choices);
    },
};

export default podcastCommand