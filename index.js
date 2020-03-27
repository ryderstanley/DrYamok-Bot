/* You will need your pxls-token to use this bot.
 * In chrome dev tools, go to the Application tab, find "Cookies" on the sidebar.
 * Click the url under the Cookies dropdown, and find the value under "pxls-token" and enter it below.
 * DO NOT SHARE YOUR TOKEN!!!!!!!
 * 
 * Once you have obtained your auth token, make sure you have node.js installed from https://nodejs.org/en/.
 * In a command line, change your directory to the folder with this file and the package.json file in it using the `cd` command.
 * After that, run `npm install`. Once this has finished running, you may start the bot with `node index.js`.
 */
console.log = function(msg){};//disable console.log. COmment out this line to re-enable.
const WebSocket = require('ws');
const blessed = require('blessed'),
  contrib = require('blessed-contrib'),
  screen = blessed.screen(),
  grid = new contrib.grid({
    rows: 3,
    cols: 5,
    screen: screen
  });
const https = require('https');
const runtime = require('minimist')(process.argv.slice(2));

var line = grid.set(0, 0, 1, 2, contrib.line, {
  showNthLabel: 1,
  style: {
    line: "yellow",
    text: "green",
    baseline: "black"
  },
  xLabelPadding: 3,
  xPadding: 5,
  label: 'Overall Activity'
})

var donut = grid.set(0, 2, 1, 1, contrib.donut, {
  label: 'Load',
  radius: 16,
  arcWidth: 4,
  yPadding: 2,
  data: [{
    label: 'Buffer',
    percent: 0
  }]
});

var log = grid.set(1, 0, 2, 1, contrib.log, {
  fg: "green",
  selectedFg: "green",
  label: 'Raw Socket'
});
var serverLog = grid.set(1, 1, 2, 1, contrib.log, {
  fg: "green",
  label: 'Server Logs'
});
var lineData = {
  x: ['1:00', '0:55', '0:50', '0:45', '0:40', '0:35', '0:30', '0:25', '0:20', '0:15', '0:10', '0:05', '0:00'],
  y: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
}

line.setData([lineData])

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});


let active = "limit";

if(runtime.hasOwnProperty("m")) {
  active = runtime.m;
}

let buffer = [];
let bufferLimit = 5;

let activity = 0;
setInterval(function() {
  lineData.y.shift();
  lineData.y.push(activity);
  line.setData([lineData]);
  activity = 0;
}, 5000);

let tail;
let head = "{Node}";

let cooldownLock = false;
let cooldown;

let counter = 0;
let counterContribs = [];

let silence = false;
let time = 0;

let limitedWarning=false;

let trusted = ["BRH0208", "MiniatureKitten", "Mikarific", "Silver","NSpeed","SoftwareKitten","CP_Pixels"];

let command;

function connect() {
  const ws = new WebSocket('wss://hotchocolate.exposed/ws', { //update as place is blocked
    headers: {
      Cookie: 'pxls-token=<Your PXLS Token>'
    }
  });
  ws.on('message', function incoming(data) {
    log.log(data)
    data = JSON.parse(data);
    activity++;
    lineData.y[lineData.y.length - 1]++;
    line.setData([lineData]);
    /*if (data.type == "chat_cooldown") {
      clearTimeout(cooldown);
      cooldownLock = true;
      cooldown = setTimeout(function() {
        cooldownLock = false;
      }, data.diff);
      sendResult(data.message); //reschedule
    }*/
    if (data.type == "chat_message") {
      var content = data.message.message_raw;
      var author = data.message.author;
      if (silence&&author!="DrYamok") { //sometimes it sets itself off
        var currentTime = new Date();
        var seconds = Math.round((currentTime.getTime() - time) / 1000);
        var minutes = Math.floor(seconds / 60);
        seconds -= minutes*60;
        ws.send('{"type":"ChatMessage","message":"{Node} Silence broken by @' + author + ' after ' + (minutes > 0 ? minutes + " " + (minutes = 1 ? "minute" : minutes) + " and " : "") + seconds + " " + (seconds != 1 ? "seconds" : "second") + '. Thanks for your participation, or lack thereof"}');
        silence = false;
      }
      var badges = [];
      //"badges":[{"displayName":"Donator","tooltip":"Donator","type":"icon","cssIcon":"fas fa-dollar-sign"},{"displayName":"10k+","tooltip":"10k+ Pixels Placed","type":"text"}]
      for (var i = 0; i < data.message.badges.length; i++) {
        badges.push(data.message.badges[i].displayName);
      }
      var donator = badges.includes("Donator")||badges.includes("Moderator")||badges.includes("Developer")||badges.includes("Admin");
      console.log(JSON.stringify(data.message.badges));
      console.log(JSON.stringify(badges));
      tail = "{triggered by @" + author + "}";
      var args = content.match(/(?:[^\s"]+|"[^"]*")+/g);
      if (args[0].toLowerCase() == "/findbots" && active!="false") {
        sendResult("All bot commands: apex-one.incode-labs.com/manpage.html "+(active=="limit"?"Limited mode is ON. Only donators, mods, and trusted users can execute commands.":""));
        return false;
      }
      if (
        args[0].toLowerCase() != "@dryamok" && //change these to your username
        args[0].toLowerCase() != "@dr. yamok") {
        return false;
      }

      args.shift();
      var pos = 0;
      if(args[pos])
      command = args[pos].toLowerCase();
      else return false;
      if (active == "false" && command != "/remotemanage") return false;
      if(
        active=="limit"&&
        args[0].charAt(0)=="/"&&
        author!="DrYamok"&& //change to your username
        !trusted.includes(author)&&
        !badges.includes("Donator")&&
        !badges.includes("Moderator")&&
        !badges.includes("Developer")&&
        !badges.includes("Admin")
      ) {
        if(!limitedWarning) {
          sendResult("Limited mode is active! Only Moderators, Donators, and Trusted Users may use the bot at this time.");
          limitedWarning=true;
          setTimeout(()=>{
            limitedWarning=false;
          },300000); //5min in mili
        }
        if(active=="test") {
          head="{Testing}";
        }
        if(
        active=="test"&&
        args[0].charAt(0)=="/"&&
        author!="DrYamok"&&
        !trusted.includes(author)
        ) {
          return false;
        }
        return false;
      }
        
      switch (command) {
        case "/node":
          sendResult("Running");
          break;
        case "/remotemanage":
          if (args[pos + 1] == "--help" || args[pos + 1] == "-h") {
            sendResult('Moderators and trusted users may use this command. USAGE: @DrYamok /remotemanage [status] [on|off]');
            return false;
          }
          var result = "";
          if (author != "DrYamok") {
            var cont = false;

            if (args[pos + 1] == "-p" || args[pos + 1] == "--pass") {
              pos += 2; //change later to accomodate password
              result += "Password not implemented";
            } else if (trusted.includes(author)) {
              result += "Trusted User overide active"
              cont = true;
            } else if (
              badges.includes("Developer") ||
              badges.includes("Moderator")
            ) {
              result += "Moderator Overide active";
              cont = true;
            } else {
              result+="Unauthorized";
            }
            if (!cont) {
              sendResult(result);
              return false;
            }
          }
          //anyway... that was all auth and special cases
          switch (args[pos + 1]) {
            case "status":
              pos++;
              if (args[pos + 1] == "on") {
                active = "true";
              } else if (args[pos + 1] == "off") {
                active = "false";
              } else if (args[pos + 1] == "limit") {
                active = "limit";
                result+="Bot is now limited. Only moderators, donators, and trusted users may use this bot until limited is turned off.";
              } else if (args[pos + 1] == "test") {
                active = "test";
                result+="Bot is now in testing and will only respond to the bot owner and Trusted Users";
              }
              result += " STATUS: " + active;
              break;
            case "rate":
              sendResult("rate is deprecated. Buffer commands will come out at some point.")
              break;
            default:
              result += "Unknown command: " + args[pos + 1] + "\n see the manpage for usage";
          }
          if (args[args.length - 1] != "--silent" && args[args.length - 1] != "-s")
            sendResult(result);
          break;
        case "/getmebanned":
          pos++;
          if (args[pos] == "--help" || args[pos] == "-h") {
            sendResult("/getMeBanned, an Experiment by Dr. Yamok\ngenerates reasons to ban you on call\nExample: >@DrYamok /getMeBanned [optional: Username]");
          } else {
            var person = "@" + author;
            if (args.length > pos)
              if (args[pos].length > 0) {
                person = args[pos];
              }
            var guilty = ["is guilty of","is wanted by Interpol for", "needs to go into hiding for","will be on trial for","is FBI most wanted for","is on a list for"];
            var locations = ["the local Taco Bell", "the FBI field office","a shared drive","the next season of place","the examples in geography books","ThunderRidge"];
            var reason = ["tax evasion", "home robbery", "spamming", "bot abuse", "master hacking", "taking hostages", "following the rules", "being a demon", "using Grill Emojis", "using HotSprings", "Booping", "attempting to fight Pinapia", "illegal things", "graffiti", "Pixel Theft", "various warcrimes", "poking fishyviolet", "being valid", "attempting to use /getmebanned against @DrYamok","setting "+pickRandom(locations)+" on fire", "breaking the silence","using Arch btw","fighting the void","not joining HuntPost","destroying the world","destroying various galaxies", "breaking into "+pickRandom(locations),"pixel hacking","pasting the Bee Movie script in chat","taking the last slice of pizza","taking Cegielski's table","arson","being gullible", "messing with NSpeed's hearts", "breaking the chat filter"];
            var date = ["in the last week", "in the last month", "in the last year", "in the last 5 minutes", "since records began in 1873","since Season 2"];
            var counts = Math.floor(Math.random() * 20) + 1;
            var plural = counts > 1 ? "counts" : "count";
            var andthen = ["And that's just what we know of","That's a little less than @Subscribble!","The Pinapia king dissaproves.","The NMS Atlas dissaproves.", "The Turt King dissaproves.","Mika dissaproves."];
            var sentence = person + " "+ guilty[Math.floor(Math.random() * guilty.length)] +" " + counts + " " + plural + " of " + reason[Math.floor(Math.random() * reason.length)] + " " + date[Math.floor(Math.random() * date.length)] + (Math.random() > 0.5 ? " alone!" : "!") + (Math.random() > 0.50 ? "" : " "+pickRandom(andthen));
            var target = person.toLowerCase();
            if (target == "@raptor_cultist" || target == "raptor_cultist") sentence = "@Raptor_Cultist is guilty of all the counts of being a demon forever.";
            else if (target.match(new RegExp('/@?(((dr)?y[@a4]m[o0]k)|m[e3])/'))) sentence = "You thought you could use my most powerful weapon against me?";
            else if (target == "@miniaturekitten" || target == "miniaturekitten") sentence = "@Miniature kitten is guilty of 3 counts of being a Russian Spy since the dissolving of the Soviet Union!";
            //else if (target == "@brh0208" || target == "brh0208") sentence = "@BRH0208 is just generally an evil person and is of peak suspicion";
            else if (author != "Silver" && target == "@silver" || target == "silver") sentence = author + " is wanted by the NSA for conspiring with Edward Snowden to find out Silver's Name!";
            if (target == "@cp_pixels" || target == "pc_pixels") sentence = "@CP_Pixels "+ guilty[Math.floor(Math.random() * guilty.length)] +" " + counts + " " + plural + " of going into NSpeed Mode " + date[Math.floor(Math.random() * date.length)] + (Math.random() > 0.5 ? " alone!" : "!") + (Math.random() > 0.50 ? "" : " "+pickRandom(andthen));
            else if (author != "Subscribble" && target == "@subscribble" || target == "subscribble") sentence = "ACTUALLY, "+ author + " has stolen Subscribble's shredded cheese " + (counts+1) +" times!";
            else if (target == "@mikarific" || target == "mikarific") sentence = "If @Mikarific is banned, place will implode into a singularity and consume the earth. Thus, I cannot, morally, get @Mikarific banned.";
            //https://rubular.com/r/Z7TzVZNx9dEUkQ
            sendResult(sentence);
          }
          break;
        case "/flipacoin":
          var coin = Math.random();
          var send = "";
          if (coin < 0.00017) { //~1/6000 chance according to https://journals.aps.org/pre/abstract/10.1103/PhysRevE.48.2547
            send = "It landed on the side... that's a 1/6000 chance!";
          } else if (coin > 0.5) {
            send = "Heads!";
          } else {
            send = "Tails!";
          }

          sendResult(send);
          break;
        case "/roll":
          if (args[1] == "--help" || args[1] == "-h") {
            sendResult("/roll, an Experiment by Dr. Yamok\Rolls a d6 (Donators can roll any side die)\nExample: >@" + username + " /roll [(-d|--sides) sides]");
          } else {
            var sides = 6;
            if(args[1]=="-d" || args[1]=="--sides") {
              if(!donator&&author!="Mikarific") {
                sendResult("Only Donator Rank on STEM Place may specify the kind of die");
                return false;
              }
              sides = args[2];
            }
            sendResult("Rolled a " + (Math.floor(Math.random()*sides)+1) + " on a d"+sides+".");
          }
          break;
        case "/huntpost":
          if (args[1] == "--help" || args[1] == "-h") {
            sendResult("/huntpost, an Experiment by Dr. Yamok\nPicks a random Huntington Post article\nExample: >@" + username + " /huntpost");
          } else {
            specs=[];
            if(args[1] == "-n" || args[1] == "--newest") {
              specs.push("newest=1");
            } else if(args[1]=="-s" || args[1]=="--specific") {
              if(!donator&&author!="Mikarific") {
                sendResult("Only Donator Rank on STEM Place may specify an article");
                return false;
              }
              specs.push("specific="+args[2]);
            }
              https.get('https://huntingtonpost.org/auto.php' + (specs.length>0 ? "?"+specs.join("&") : ""), (resp) => {
                let data = '';

                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                  data += chunk;
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                  sendResult(data);
                });

              }).on("error", (err) => {
                serverLog.log(err);
              });
          }
          break;
        case "/meme":
          if (args[1] == "--help" || args[1] == "-h") {
            sendResult("/huntpost, an Experiment by Dr. Yamok\nPicks a random meme from huntingtonpost.org/placeMemes\nExample: >@" + username + " /meme");
          } else {
            https.get('https://huntingtonpost.org/placeMemes/auto.php?', (resp) => {
              let data = '';

              // A chunk of data has been recieved.
              resp.on('data', (chunk) => {
                data += chunk;
              });

              // The whole response has been received. Print out the result.
              resp.on('end', () => {
                sendResult(data);
              });

            }).on("error", (err) => {
              serverLog.log(err);
            });
          }
          break;
        /*case "/count":
          counter++;
          var needNew = true;
          for (var i = 0; i < counterContribs.length && needNew; i++) {
            if (counterContribs[i][0] == author) {
              counterContribs[i][1]++;
              needNew = false
            }
          }
          if (needNew) {
            counterContribs.push(new Array(author, 1));
          }
          if (counter % 10 == 0) {
            counterContribs.sort(function(a, b) {
              return a[1] - b[1]
            });
            var constructor = "";
            for (var i = 0; i < counterContribs.length; i++) {
              constructor += "\n\r@" + counterContribs[i][0] + " at " + counterContribs[i][1];
            }
            sendResult("Milestone! " + counter + " thanks to " + constructor);
          } else if (counter % 5 == 0)
            sendResult("Counter now at " + counter);

          break;*/
        case "/silence":
          silence = true;
          var now = new Date();
          time = now.getTime();
          break;
        case "/hothot":
          if((args[1]=="-w"||args[1]=="--whole")&&author=="Mikarific") {
            sendResult(`Hot! Hot! Ooh, we got it! Hot! Hot! Hey, we got it! Hot! Hot! Say, we got it! Hot chocolate! Hot! Hot! Oh, we got it! Hot! Hot! So, we got it! Hot! Hot! Yo, we got it! Hot chocolate! Here, we've only got one rule: Never ever let it cool! Keep it cookin in the pot, You've got- Hot choc-o-lat! Hot! Hot! Ooh, we got it! Hot! Hot! Hey, we got it! Hot! Hot! Say, we got it! Hot chocolate! Hot! Hot! Oh, we got it! Hot! Hot! So, we got it! Hot! Hot! Yo, we got it! Hot chocolate! Here, we only got one rule: (Here, we only got one rule:) Never ever let it cool! (Never ever let it cool!) Keep it cookin in the pot, Soon, ya got hot choc-o-lat! Hot! Hot! Ooh, we got it! Hot! Hot! Hey, we got it! Hot! Hot! Say, we got it! Hot chocolate! Hot! Hot! Oh, we got it! Hot! Hot! So, we got it! Hot! Hot! Yo, we got it! Hot chocolate! Here, we only got one rule: (Here, we only got one rule:) Never ever let it cool! (Never ever let it cool!) Keep it cookin in the pot, Soon, ya got hot choc-o-lat! Hot! Hot! Hey, we got it! Hot! Hot! Whoa, we got it! Hot! Hot! Yeah, we got it! Hot! Hot! Whoa, we got it! Hot! Hot! Hey, we got it! Hot! Hot! Whoa, we got it! Hot! Hot! Yeah, we got it! Hot! Hot! Whoa, we got it! Hot! Hot! Yeah, we got it! Hot! Hot! Whoa, we got it! Hot! Hot! Yeah, we got it! Hot! Hot! Yeah, we got it! Hot! Hot! Yeah, we got it! Hot! Hot! Whoa, we got it! Hot! Hot! Yeah, we got it! Hot chocolate!`);
          }
          else {
            sendResult("Hey, we got it!");
          }
          break;
        case "/help":
          sendResult(`MANPAGE: apex-one.incode-labs.com/manpage.html`); //substitute your own man page
          break;
      }
    }
  });
  ws.onclose = function(e) {
    serverLog.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
    setTimeout(function() {
      connect();
    }, 1000);
  };

  ws.onerror = function(err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    ws.close();
    process.exit()
  };

  function sendResult(str) {
    serverLog.log("Schedule: " + str)
    buffer.push(JSON.stringify({"type":"ChatMessage","message":(head + " " + str + " " + tail)}));
    buffer.push('{"type":"ChatMessage","message":"' + (head + " " + str + " " + tail).replace("\"", "'") + '"}');
    ws.send('{"type":"ChatMessage","message":"'+(head+" "+str+" "+tail).replace("\"","\\\"")+'"}');
    console.log((new Date()).toISOString()+" : " + '{"type":"ChatMessage","message":"'+(head+" "+str+" "+tail).replace("\"","\\\"")+'"}');
  }
  var runBuffer = setInterval(function() {
    if (buffer.length > bufferLimit) {
      serverLog.log("WARNING Buffer Overflow! Dropping " + (buffer.length - bufferLimit) + " results");
      buffer = buffer.slice(0, bufferLimit);
    }
    bufferUsage = buffer.length / bufferLimit;
    donut.setData([{
      percent: parseFloat(bufferUsage).toFixed(2),
      label: 'Buffer',
      'color': (bufferUsage < 0.5 ? 'green' : (bufferUsage < 0.8 ? 'orange' : 'red'))
    }]);
    screen.render();
    if (buffer.length > 0 && !cooldownLock) ws.send(buffer.shift());
  }, 2000);
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}
connect();


screen.render()

/*screen.on('resize', function() {
  donut.emit('attach');
  log.emit('attach');
  serverLog.emit('attach');
  line.emit('attach');
});*/

var newprompt = '/mikaleave';
var newprompt2 = '/pxlcount';
