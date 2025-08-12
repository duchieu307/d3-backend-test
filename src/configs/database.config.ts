import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource, DataSourceOptions } from 'typeorm';

type SqlDbType = 'mysql' | 'postgres';

export const dataSourceOptions: DataSourceOptions = {
  type: process.env.DB_TYPE as SqlDbType,
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../**/migrations/*{.ts,.js}'],
  timezone: 'Z',
  synchronize: false,
  logging: true,
  extra: {
    connectionLimit: process.env.DB_CONNECTION_LIMIT,
  },
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
