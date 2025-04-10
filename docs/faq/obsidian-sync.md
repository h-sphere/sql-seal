# Using SQLSeal with Obsidian Sync
It's been reported that SQLSeal does not work with Obsidian Sync due to file limit during synchronisation. Because of that the main script of the plugin is not getting synchronised.
The only workaround for now now is to copy `.obsidian/sql-seal/main.js` manually. You will need to do it after every plugin update you perform.