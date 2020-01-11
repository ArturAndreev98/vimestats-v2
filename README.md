# VimeStats
Бот для сбора и отправки данных сервера VimeWorld MiniGames<br>
[!] Данный проект НЕ ЯВЛЯЕТСЯ официальным, а также как-то связанным с сайтом [vimestats.ru](https://vimestats.ru).

## Установка и использование
Для начала, установите vimestats как пакет
```js
$ npm i github:vladciphersky/vimestats-v2
```
В основной файл вставьте этот код:
```js
const vs = require('vimestats-v2');
const vsconfig = {
    token: 'токен-бота',
    prefix: 'префикс-бота',
    colors: { // Можно настроить под себя.
        info: "#7289DA",
        error: "RED",
        warn: "#FBFF00"
    }
};
```
Затем, в событие `ready` вставьте данную строчку:
```js
vs(vsconfig.token, vsconfig.prefix, vsconfig.colors);
```

## Лицензия
Смотрите в файле [LICENSE](https://github.com/vladciphersky/vimestats-v2/blob/master/LICENSE).