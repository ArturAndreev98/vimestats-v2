const moment = require('moment');
require('moment-duration-format');

const Vime = require('vimelibrary');
const { Client, RichEmbed } = require('discord.js');

module.exports = function(token, prefix, colors) {
    if(!token) return new ReferenceError('Token wasn\'t provided.');
    if(!prefix) return new ReferenceError('Prefix wasn\'t provided.');

    const client = new Client();
    client.vime = {
        user: new Vime.User(),
        guild: new Vime.Guild(),
        online: new Vime.Online(),
        utils: Vime.Utils
    };

    client.on('ready', () => console.log(`Бот запущен под аккаунтом ${client.user.tag} (префикс: ${prefix}).`));
    client.on('message', async (message) => {
        if(message.author.bot) return;
        if(!message.content.startsWith(prefix)) return;
        const args = message.content.slice(prefix.length).split(' ');
        const command = args.shift().toLowerCase();

        function error(message, text) {
            const embed = new RichEmbed()
                .setColor(colors.error || "RED")
                .setTitle('Произошла ошибка при выполнении команды')
                .setDescription(text)
                .setFooter(`Запрос от ${message.author.tag}`, message.author.displayAvatarURL)
                .setTimestamp();

            return message.delete().then(() => message.channel.send(embed));
        }

        if(command == "help") {
            var commands = `Префикс для использования команд: \`${prefix}\`\n\n`+
            `Игрок:\n`+
            `- \`stats <никнейм>\` | Просмотр статистики игрока\n`+
            `- \`friends <никнейм>\` | Перечисление друзей игрока\n\n`+
            `Гильдия:\n`+
            `- \`guild -i <ID> | -t <тэг> | -n <имя>\` | Просмотр статистики гильдии\n\n`+
            `Онлайн:\n`+
            `- \`online\` | Просмотр онлайна на сервере\n`+
            `- \`streams\` | Просмотр идущих стримов на сервере\n`+
            `- \`staff\` | Перечисление персонала сервера онлайн`;

            const embed = new RichEmbed()
                .setColor(colors.info || "#36393f")
                .setTitle('Команды для взаимодействия с данными VimeWorld')
                .setDescription(commands)
                .setFooter(`Запрос от ${message.author.tag}`, message.author.displayAvatarURL)
                .setTimestamp();

            return message.delete().then(() => message.channel.send(embed));
        }

        if(command == "stats") {
            if(args.length < 1) return error(message, 'Недостаточно аргументов для выполнения команды!');
            
            let regexp = /[^\u0000-\u007f]/;
            if(regexp.test(args[0])) return error(message, 'Имя игрока должно содержать только цифры, буквы и символ `_`.');

            const member = await client.vime.user.get('name', encodeURI(args[0]));
            if(!member[0]) return error(message, 'Игрока с таким ником нет и никогда не существовало на сервере!');

            var info = `ID: \`${member[0].id}\`\n`+
            `Уровень: ${member[0].level} ур. \`[${Math.floor(member[0].levelPercentage * 100)}%]\`\n`+
            `Наигранное время: \`${moment.duration(member[0].playedSeconds).format('h [ч.] m [мин.]')}\`\n`+
            `Последний вход на сервер: \`${moment(member[0].lastSeen * 1000).locale('ru').format('LLL')}\`\n`+
            `${(member[0].guild == null) ? "Не находится в гильдии" : `Находится в гильдии \`${(member[0].guild.tag == null) ? "" : `<${member[0].guild.tag}> `}${member[0].guild.name}`}\``;

            const embed = new RichEmbed()
                .setColor(client.vime.utils.userRanks[member[0].rank].color)
                .setTitle(`Статистика игрока [${client.vime.utils.userRanks[member[0].rank].rank}] ${member[0].username}`)
                .setDescription(info)
                .setThumbnail(`https://skin.vimeworld.ru/helm/${member[0].username}.png`)
                .setFooter(`Запрос от ${message.author.tag}`, message.author.displayAvatarURL)
                .setTimestamp();

            return message.delete().then(() => message.channel.send(embed));
        }

        if(command == "friends") {
            if(args.length < 1) return error(message, 'Недостаточно аргументов для выполнения команды!');
            
            let regexp = /[^\u0000-\u007f]/;
            if(regexp.test(args[0])) return error(message, 'Имя игрока должно содержать только цифры, буквы и символ `_`.');

            const member = await client.vime.user.get('name', encodeURI(args[0]));
            if(!member[0]) return error(message, 'Игрока с таким ником нет и никогда не существовало на сервере!');

            client.vime.user.friends(member[0].id).then((data) => {
                let info = '';
                data.forEach((friend) => {
                    info += `[${client.vime.utils.userRanks[friend.rank].rank}] \`${friend.username}\`\n`;
                });

                if(info.length >= 2048) info = `${info.slice(0, 2000)}..\nДалее идёт лимит.`;
                const embed = new RichEmbed()
                    .setColor(client.vime.utils.userRanks[member[0].rank].color)
                    .setTitle(`Друзья (${data.length}) игрока [${client.vime.utils.userRanks[member[0].rank].rank}] ${member[0].username}`)
                    .setDescription(info)
                    .setThumbnail(`https://skin.vimeworld.ru/helm/${member[0].username}.png`)
                    .setFooter(`Запрос от ${message.author.tag}`, message.author.displayAvatarURL)
                    .setTimestamp();

                return message.delete().then(() => message.channel.send(embed));
            });
        }

        if(command == "guild") {
            if(args.length < 2) return error(message, 'Недостаточно аргументов для выполнения команды!');
            
            let guild = null;
            switch (args[0]) {
                case "-i":
                    guild = await client.vime.guild.get('id', args.slice(1).join(" "));
                    if(guild.error && guild.error.error_code == 12) return error(message, 'Гильдии с таким ID нет и никогда не существовало на сервере!');
                    break;

                case "-t":
                    guild = await client.vime.guild.get('tag', args.slice(1).join(" "));
                    if(guild.error && guild.error.error_code == 12) return error(message, 'Гильдии с таким тэгом нет и никогда не существовало на сервере!');
                    break;

                case "-n":
                    guild = await client.vime.guild.get('name', args.slice(1).join(" "));
                    if(guild.error && guild.error.error_code == 12) return error(message, 'Гильдии с таким именем нет и никогда не существовало на сервере!');
                    break;
            }

            let leader = [];
            let officer = [];
            var total = {
                coins: 0,
                xp: 0
            };

            guild.members.forEach((member) => {
                total.coins += member.guildCoins;
                total.xp += member.guildExp;
                if(member.status == "LEADER") leader.push(`[${client.vime.utils.userRanks[member.user.rank].rank}] ${member.user.username}`);
                if(member.status == "OFFICER") officer.push(`[${client.vime.utils.userRanks[member.user.rank].rank}] ${member.user.username}`);
            });

            var info = `ID: \`${guild.id}\`\n`+
            `Уровень: ${guild.level} ур. \`[${Math.floor(guild.levelPercentage * 100)}%]\`\n`+
            `Дата создания: \`${moment(guild.created * 1000).locale('ru').format('LLL')}\`\n`+
            `Вложено коинов: \`${total.coins}\`\n`+
            `Вложено опыта: \`${total.xp}\``;

            var staff = `Лидер гильдии: \`${leader[0]}\`\n`+
            `Офицеры гильдии: \`${(!officer[0]) ? 'не найдено' : officer.join("`, `")}\``;

            let perks = '';
            Object.keys(guild.perks).forEach((objectKey) => {
                let perk = guild.perks[objectKey];
                perks += `${perk.name}: ${perk.level} ур.\n`;
            });

            const embed = new RichEmbed()
                .setColor(client.vime.utils.tagColors[guild.color])
                .setTitle(`Статистика гильдии ${(guild.tag == null) ? "" : `<${guild.tag}> `}${guild.name}`)
                .setDescription(info)
                .addField('Персонал гильдии', staff)
                .addField('Перки гильдии', perks)
                .setThumbnail((guild.avatar_url == null) ? `https://sqdsh.top/images/vimestats/no_avatar.jpg` : guild.avatar_url)
                .setFooter(`Запрос от ${message.author.tag}`, message.author.displayAvatarURL)
                .setTimestamp();

            return message.delete().then(() => message.channel.send(embed));
        }

        if(command == "online") {
            let info = '';
            const data = await client.vime.online.get('online');

            var games = {
                "ann": "Annihilation",
                "bb": "BuildBattle",
                "bp": "BlockParty",
                "bw": "BedWars",
                "cp": "ClashPoint",
                "dr": "DeathRun",
                "duels": "Дуэли",
                "gg": "GunGame",
                "hg": "HungerGames",
                "kpvp": "KitPvP",
                "lobby": "Лобби",
                "mw": "MobWars",
                "prison": "Prison",
                "sw": "SkyWars",
                "murder": "Murder Mystery",
                "bridge": "The Bridge",
                "jumpleague": "Jump League",
                "paintball": "Paintball",
                "turfwars": "Turf Wars",
                "sheep": "SheepWars",
                "spleef": "Spleef",
                "tntrun": "TNT Run",
                "tnttag": "TNT Tag"
            };

            let total = 0;
            Object.keys(data.separated).forEach((objectKey) => {
                var game = {
                    name: games[objectKey],
                    online: data.separated[objectKey]
                };

                info += `${game.name}: ${game.online}\n`;
                total += game.online;
            });

            const embed = new RichEmbed()
                .setColor(colors.info || "#36393f")
                .setTitle(`Онлайн (${total} чел.) на сервере`)
                .setDescription(info)
                .setThumbnail(`https://sqdsh.top/images/vimestats/person.png`)
                .setFooter(`Запрос от ${message.author.tag}`, message.author.displayAvatarURL)
                .setTimestamp();

            return message.delete().then(() => message.channel.send(embed));
        }

        if(command == "streams") {
            let info = '';
            const data = await client.vime.online.get('streams');

            data.forEach((stream) => {
                info += `\`${stream.title}\`\n`+
                `Стример: \`[${client.vime.utils.userRanks[stream.user.rank].rank}] ${stream.user.username}\`\n`+
                `Зрителей: \`${stream.viewers}\`\n`+
                `Платформа: \`${stream.platform}\`\n`+
                `Ссылка: [нажмите сюда](${stream.url})\n\n`;
            });

            const embed = new RichEmbed()
                .setColor(colors.info || "#36393f")
                .setTitle(`Стримеры (${data.length} чел.) на сервере`)
                .setDescription(info)
                .setThumbnail(`https://sqdsh.top/images/vimestats/person.png`)
                .setFooter(`Запрос от ${message.author.tag}`, message.author.displayAvatarURL)
                .setTimestamp();

            return message.delete().then(() => message.channel.send(embed));
        }

        if(command == "staff") {
            let info = '';
            const data = await client.vime.online.get('staff');

            data.forEach((member) => {
                info += `\`[${client.vime.utils.userRanks[member.rank].rank}] ${member.username}\`\n`;
            });

            const embed = new RichEmbed()
                .setColor(colors.info || "#36393f")
                .setTitle(`Персонал (${data.length} чел.) на сервере`)
                .setDescription(info)
                .setThumbnail(`https://sqdsh.top/images/vimestats/person.png`)
                .setFooter(`Запрос от ${message.author.tag}`, message.author.displayAvatarURL)
                .setTimestamp();

            return message.delete().then(() => message.channel.send(embed));
        }
    });

    client.login(token);
};