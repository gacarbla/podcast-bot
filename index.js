import { Client, GatewayIntentBits, PermissionsBitField, SlashCommandBuilder, Collection, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let podcastActive = false;  // Estado del podcast
let podcastStartTime = null; // Para almacenar el tiempo de inicio del podcast
let timeouts = [];  // Para almacenar los temporizadores de las alertas

client.commands = new Collection();

// Comando para iniciar el podcast (slash command)
const podcastStart = new SlashCommandBuilder()
    .setName('podcast')
    .setDescription('Comando para gestionar el podcast')
    .addSubcommand(subcommand => 
        subcommand.setName('start').setDescription('Iniciar el podcast'))
    .addSubcommand(subcommand => 
        subcommand.setName('end').setDescription('Finalizar el podcast'));

// Guardar los comandos en un array para registrarlos más adelante
const commands = [
    podcastStart.toJSON() // Convertir a JSON para registrar los comandos
];

// Registro de comandos utilizando REST
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // El método put se usa para registrar comandos en todos los servidores
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),  // Cambia por el clientId adecuado
            { body: commands }
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

// Función para configurar los permisos del canal
const setChannelPermission = async (channel, role, canWrite) => {
    await channel.permissionOverwrites.edit(role, {
        SendMessages: canWrite
    });
};

// Función para manejar el inicio y fin del podcast
const handlePodcastCommand = async (interactionOrMessage, subCommand, audienceRole, targetChannel, alertChannel, hasPermissions) => {
    if (subCommand === 'start') {
        if (!hasPermissions) {
            await interactionOrMessage.reply({content: 'No tienes permisos para iniciar el podcast.', ephemeral: true});
            return;
        }
        if (podcastActive) {
            await interactionOrMessage.reply({content: 'Ya hay un podcast activo.', ephemeral: true});
            return;
        }

        podcastActive = true;
        podcastStartTime = Date.now(); // Registrar el tiempo de inicio

        // Modificar permisos para permitir escribir en el canal
        await setChannelPermission(targetChannel, audienceRole, true);
        await interactionOrMessage.reply({content: 'Podcast iniciado. Permisos de escritura habilitados para la audiencia.', ephemeral: true});

        function sendTimeAlert(alertChannel, time) {
            let message = `Han pasado ${time} minutos`; // Mensaje por defecto
        
            // Definir el mensaje según el tiempo
            if (time === 45) {
                message = '¡Han pasado 45 minutos en el podcast! 🚨';
            } else if (time === 90) {
                message = '¡Han pasado 90 minutos en el podcast! 🚨';
            } else if (time === 110) {
                message = '¡Llevan 110 minutos, casi 2 horas! ⏰';
            } else if (time === 120) {
                message = '¡Se cumplen 2 horas en el podcast! 🕒';
            } else if (time > 120) {
                message = `El podcast se ha alargado ${time - 120} minutos. ⚠️`;
            }
        
            // Enviar el mensaje al canal de alertas
            if (message) {
                alertChannel.send(message);
            }
        }        

        // Temporizadores para enviar alertas
        const alertTimes = [45, 90, 110, 120, 125, 135, 150, 180];
        alertTimes.forEach(time => {
            const timeout = setTimeout(() => sendTimeAlert(alertChannel, time), time * 60 * 1000);
            timeouts.push(timeout);
        });

    } else if (subCommand === 'end') {
        if (!hasPermissions) {
            await interactionOrMessage.reply({content: 'No tienes permisos para finalizar el podcast.', ephemeral: true});
            return;
        }
        if (!podcastActive) {
            await interactionOrMessage.reply({content: 'No hay ningún podcast activo.', ephemeral: true});
            return;
        }

        const elapsedTime = (Date.now() - podcastStartTime) / 1000 / 60; // Convertir a minutos

        if (elapsedTime < 45) {
            // Si el podcast ha durado menos de 45 minutos, pedir confirmación
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirmEnd')
                        .setLabel('Confirmar finalizar')
                        .setStyle(ButtonStyle.Danger)
                );

            await interactionOrMessage.reply({
                content: `El podcast ha durado menos de 45 minutos (${Math.floor(elapsedTime)} minutos). ¿Estás seguro de que deseas finalizarlo?`,
                components: [row],
                ephemeral: true
            });

            // Escuchar la interacción del botón
            const filter = i => i.customId === 'confirmEnd' && i.user.id === interactionOrMessage.user.id;
            const collector = interactionOrMessage.channel.createMessageComponentCollector({ filter, time: 15000 });

            collector.on('collect', async i => {
                if (i.customId === 'confirmEnd') {
                    podcastActive = false;
                    await setChannelPermission(targetChannel, audienceRole, false);
                    await i.update({ content: 'Podcast finalizado. Permisos de escritura deshabilitados para la audiencia.', components: [] });

                    // Cancelar todos los temporizadores de alertas
                    timeouts.forEach(timeout => clearTimeout(timeout));
                    timeouts = [];
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interactionOrMessage.followUp('El tiempo para confirmar ha expirado.');
                }
            });

        } else {
            // Si ha durado más de 45 minutos, finalizar inmediatamente
            podcastActive = false;

            // Modificar permisos para deshabilitar la escritura en el canal
            await setChannelPermission(targetChannel, audienceRole, false);
            await interactionOrMessage.reply({content: 'Podcast finalizado. Permisos de escritura deshabilitados para la audiencia.', ephemeral: true});

            // Cancelar todos los temporizadores de alertas
            timeouts.forEach(timeout => clearTimeout(timeout));
            timeouts = [];
        }
    }
};

// Manejo de slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, member, guild } = interaction;

    if (commandName === 'podcast') {
        const subCommand = options.getSubcommand();
        const podcasterRole = guild.roles.cache.find(role => role.id === '1106481254758613082');
        const audienceRole = guild.roles.cache.find(role => role.id === '1106242989879218176');
        const targetChannel = guild.channels.cache.find(ch => ch.id === '1104556975360049152');  // Nombre del canal de podcast
        const alertChannel = guild.channels.cache.find(ch => ch.id === '1104556975360049152');    // Canal de alertas

        if (!podcasterRole || !targetChannel || !alertChannel) {
            await interaction.reply({content: 'No se encontraron los roles o canales necesarios.', ephemeral: true});
            return;
        }

        const hasPermissions = member.roles.cache.has(podcasterRole.id) || member.permissions.has(PermissionsBitField.Flags.ManageMessages);

        await handlePodcastCommand(interaction, subCommand, audienceRole, targetChannel, alertChannel, hasPermissions);
    }
});

client.login(process.env.TOKEN);