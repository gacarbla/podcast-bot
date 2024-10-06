export const name = 'messageCreate';
export const once = false;

export async function execute(message, client, prisma) {
    const prefix = 'p!';

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        await command.execute(message, args, client, prisma);
    } catch (error) {
        console.error(error);
        await message.reply('Hubo un error al ejecutar ese comando.');
    }
}
