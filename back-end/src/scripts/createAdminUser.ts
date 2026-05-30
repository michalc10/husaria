import { disconnectPrisma } from '../database/prisma';
import userRepository from '../repositories/userRepository';

const readArg = (name: string) => {
  const prefix = `--${name}=`;
  const valueWithEquals = process.argv.find(arg => arg.startsWith(prefix));
  if (valueWithEquals) return valueWithEquals.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const main = async () => {
  const email = readArg('email');
  const password = readArg('password');
  const name = readArg('name') || email;

  if (!email || !password) {
    throw new Error('Użycie: npm run user:create-admin -- --email admin@example.com --password TymczasoweHaslo123 --name "Admin"');
  }

  const user = await userRepository.create({
    email,
    name: name || email,
    role: 'ADMIN',
    temporaryPassword: password
  });

  console.log(`Utworzono administratora: ${user.email}`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
