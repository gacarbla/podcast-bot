import dotenv from 'dotenv';

dotenv.config();

export const config = {
    PORT: process.env.PORT || 3000,
    DATABASE_URL: process.env.DATABASE_URL,  // Prisma usará esta variable para conectarse a la base de datos

    DB: {
        SHARED: {
            HOST: process.env.SHARED_DB_HOST || 'localhost',
            USER: process.env.SHARED_DB_USER || 'root',
            PASSWORD: process.env.SHARED_DB_PASSWORD || '',
            DATABASE: process.env.SHARED_DB_NAME || 'gacarbla_shared',
        },
        BOT: {
            HOST: process.env.BOT_DB_HOST || 'localhost',
            USER: process.env.BOT_DB_USER || 'root',
            PASSWORD: process.env.BOT_DB_PASSWORD || '',
            DATABASE: process.env.BOT_DB_NAME || 'gacarbla_bot',
        },
    },
};
export default config