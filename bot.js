const { Telegraf } = require('telegraf');
const axios = require('axios');

const BOT_TOKEN = '7393517628:AAEweqPfevdcExVRahjPa3fnC8iYTta_zRo';
const LICENSE_SERVER = 'https://license-server-production-dac6.up.railway.app'; // ← ТВОЙ URL

const bot = new Telegraf(BOT_TOKEN);

// Команда /start
bot.start((ctx) => {
  ctx.reply(
    '🔑 **Бот управления лицензиями**\n\n' +
    'Доступные команды:\n' +
    '🔸 /gen HWID - Создать ключ\n' +
    '🔸 /list - Список ключей\n' +
    '🔸 /ban KEY - Забанить ключ',
    { parse_mode: 'Markdown' }
  );
});

// Генерация ключа
bot.command('gen', async (ctx) => {
  const hwid = ctx.message.text.split(' ')[1];
  if (!hwid) return ctx.reply('❌ Напиши `/gen HWID`', { parse_mode: 'Markdown' });

  try {
    const { data } = await axios.post(`${LICENSE_SERVER}/generate`, { hwid });
    ctx.reply(`✅ Ключ создан!\n\n🔑: \`${data.key}\`\n🖥️ HWID: \`${hwid}\``, { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply('❌ Ошибка! Сервер не отвечает.');
  }
});

// Список ключей
bot.command('list', async (ctx) => {
  try {
    const { data } = await axios.get(`${LICENSE_SERVER}/licenses`);
    if (!data.length) return ctx.reply('Нет активных ключей.');

    let msg = '📋 Список ключей:\n\n';
    data.forEach(license => {
      msg += `🔑 ${license.key}\n🖥️ ${license.hwid}\n\n`;
    });
    ctx.reply(msg);
  } catch (error) {
    ctx.reply('❌ Ошибка загрузки списка!');
  }
});

// Бан ключа
bot.command('ban', async (ctx) => {
  const key = ctx.message.text.split(' ')[1];
  if (!key) return ctx.reply('❌ Напиши `/ban KEY`', { parse_mode: 'Markdown' });

  try {
    await axios.post(`${LICENSE_SERVER}/ban`, { key });
    ctx.reply(`🔒 Ключ \`${key}\` заблокирован!`, { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply('❌ Ошибка! Ключ не найден.');
  }
});

// Запуск бота
bot.launch().then(() => console.log('Бот запущен!'));
