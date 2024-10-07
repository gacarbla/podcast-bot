import { Client } from 'discord.js';

/**
 * Función para obtener el nombre de usuario de un usuario por su ID.
 * @param {Client} client - El cliente de Discord.
 * @param {string} userId - El ID del usuario.
 * @returns {Promise<string>} - El nombre de usuario del usuario.
 */
async function fetchUsername(client, userId) {
    try {
        const user = await client.users.fetch(userId);
        return user.username; // Devuelve el nombre de usuario
    } catch (error) {
        console.error(`Error al obtener el nombre de usuario para el ID ${userId}:`, error);
        return null;
    }
}

export { fetchUsername };