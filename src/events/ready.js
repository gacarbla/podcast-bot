// ready.js
import prisma from '../database/prismaClient.js'; // Cliente de Prisma
import { startMilestoneChecker } from '../utils/times.js';

export const name = "ready"
export const once = true;

export async function execute(client) {
    console.log(`Bot conectado como ${client.user.tag}`);

    // Obtener todos los servidores (guilds) a los que el bot tiene acceso
    const guilds = client.guilds.cache;

    // Registrar cada servidor en la base de datos
    for (const guild of guilds.values()) {
        try {
            // Upsert para asegurar que no hay duplicados y actualizar si es necesario
            await prisma.server.upsert({
                where: { discordId: guild.id },
                update: {},
                create: {
                    discordId: guild.id,
                },
            });
            console.log(`Servidor registrado: ${guild.name} (${guild.id})`);
        } catch (error) {
            console.error(`Error al registrar el servidor ${guild.name} (${guild.id}):`, error);
        }
    }

    startMilestoneChecker(client)
}
