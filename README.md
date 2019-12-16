# DrYamok-Bot
Dr. Yamok's bot. See license for usage.

## Installing
1. Clone this git repo with `git clone https://github.com/Place-bots/DrYamok-Bot.git`  
2. Moce into the created Directory `cd DrYamok-Bot`
3. Install Node modules with `npm install`
4. Edit index.js with your Pxls token on [Line 105](https://github.com/Place-bots/DrYamok-Bot/blob/master/index.js#L105)
5. Change "DrYamok" to your STEM Place username where applicable, but primarily on lines [148-149](https://github.com/Place-bots/DrYamok-Bot/blob/master/index.js#L148-L149). Wherever it says DrYamok.
6. Run the code with `node index.js`
### Run as daemon
> this uses the [Terminal Multiplexer](https://github.com/tmux/tmux/)
1. Install TMux if it is not already installed (Debian-Based: `sudo apt install tmux`)
2. start TMux with `tmux`
3. Navigate to DrYamok-Bot directory
4. Start the bot with `node index.js`
5. Press the Control Key for TMux (Default: Ctrl+B)
6. Press `D` to detach the session
It should now be running as a daemon

## Commands
See [https://apex-one.incode-labs.com/manpage.html] for a list of commands. Be aware that the bot may not be up to date with the command list.
