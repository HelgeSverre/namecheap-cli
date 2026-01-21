import chalk from 'chalk';
import { Command } from 'commander';
import { getAllConfig, getConfigPath, getConfigValue, setConfigValue } from '../../lib/config.js';
import { outputJson, success } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';

const getCommand = new Command('get')
  .description('Get a configuration value')
  .argument('<key>', 'Configuration key (sandbox, defaultOutput)')
  .action((key: string) => {
    try {
      const value = getConfigValue(key);
      console.log(String(value));
    } catch (error) {
      handleError(error);
    }
  });

const setCommand = new Command('set')
  .description('Set a configuration value')
  .argument('<key>', 'Configuration key (sandbox, defaultOutput)')
  .argument('<value>', 'Value to set')
  .action((key: string, value: string) => {
    try {
      setConfigValue(key, value);
      success(`Set ${key} = ${value}`);
    } catch (error) {
      handleError(error);
    }
  });

const listCommand = new Command('list')
  .description('List all configuration values')
  .option('--json', 'Output as JSON')
  .action((options) => {
    try {
      const config = getAllConfig();

      if (options.json) {
        outputJson({
          ...config,
          configPath: getConfigPath(),
          // Don't expose API key in JSON output
          credentials: config.credentials
            ? {
                apiUser: config.credentials.apiUser,
                userName: config.credentials.userName,
                clientIp: config.credentials.clientIp,
                apiKey: '***hidden***',
              }
            : undefined,
        });
        return;
      }

      console.log();
      console.log(chalk.bold('Configuration'));
      console.log();
      console.log(`  ${chalk.dim('Config file:')} ${getConfigPath()}`);
      console.log();
      console.log(`  ${chalk.dim('sandbox:')}       ${config.sandbox}`);
      console.log(`  ${chalk.dim('defaultOutput:')} ${config.defaultOutput}`);

      if (config.credentials) {
        console.log();
        console.log(chalk.dim('Credentials'));
        console.log(`  ${chalk.dim('apiUser:')}  ${config.credentials.apiUser}`);
        console.log(`  ${chalk.dim('userName:')} ${config.credentials.userName}`);
        console.log(`  ${chalk.dim('clientIp:')} ${config.credentials.clientIp}`);
        console.log(`  ${chalk.dim('apiKey:')}   ***hidden***`);
      }

      console.log();
    } catch (error) {
      handleError(error);
    }
  });

const pathCommand = new Command('path')
  .description('Show the configuration file path')
  .action(() => {
    console.log(getConfigPath());
  });

export const configCommand = new Command('config')
  .description('Manage CLI configuration')
  .addCommand(getCommand)
  .addCommand(setCommand)
  .addCommand(listCommand)
  .addCommand(pathCommand);
