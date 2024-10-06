// /src/events/interactionCreate.js
import manageAutocomplete from '../autocompletes/manage.js';
import prisma from '../database/prismaClient.js';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Hubo un error al ejecutar este comando.', ephemeral: true });
        }
    } else if (interaction.isAutocomplete()) {
        if (interaction.commandName === 'manage') {
            await manageAutocomplete(interaction, client);
        }
    }
}
