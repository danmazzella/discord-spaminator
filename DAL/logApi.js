const { EmbedBuilder, Client, Message, GuildMember } = require("discord.js");
const { getLogChannel, getShameChannel } = require("../DAL/databaseApi");

/**
 * 
 * @param {Client} client 
 * @param {string} guildId 
 * @param {Message} message 
 * @param {string | undefined} override
 * @param {string | undefined} supplement
 * @returns 
 */
async function forwardMessage(client, guildId, message, override = undefined, supplement = undefined) {
    try {
        const logChannel = override ?? getLogChannel(guildId);

        if (!logChannel)
            return true;
            
        let channel = client.channels.cache.get(logChannel);

        if (!channel || !channel.send)
            channel = await client.channels.fetch(logChannel);

        if (supplement) {
            try {
                const supplementaryMessage = new EmbedBuilder()
                    .setColor("#E03EC7")
                    .setTitle("Unusual behavior")
                    .setDescription(supplement)
                    .setTimestamp();

                await channel.send({ embeds: [supplementaryMessage] });
            } catch (err) {
                console.log(`Error adding supplementary message: ${err}`);
            }
        }

        await message.forward(channel);

        return true;
    } catch (err) {
        console.log(`Error logging activity: ${err}`);

        return false;
    }
}

/**
 * 
 * @param {Client} client 
 * @param {String} guildId 
 * @param {String} action 
 * @param {String} activity 
 * @param {String} color 
 * @returns {Promise}
 */
async function logActivity(client, guildId, action, activity, color = "#007bff", messageLink = undefined, override = undefined) {
    try {
        const logChannel = override ?? getLogChannel(guildId);

        if (!logChannel)
            return true;
            
        let channel = client.channels.cache.get(logChannel);

        if (!channel || !channel.send)
            channel = await client.channels.fetch(logChannel);

        const message = new EmbedBuilder()
            .setColor(color)
            .setTitle(action)
            .setDescription(activity)
            .setTimestamp();

        await channel.send({ embeds: [message], content: messageLink });

        return true;
    } catch (err) {
        console.log(`Error logging activity: ${err}`);

        return false;
    }
}

const ERROR_COLOR = "#ff00ff";

/**
 * 
 * @param {Client} client 
 * @param {String} guildId 
 * @param {String} userId 
 * @param {String} channelId 
 * @param {String} message 
 * @param {String} reason 
 * @returns {Promise}
 */
const logError = async (client, guildId, userId, channelId, message = "", reason = "unknown") =>
    await logActivity(
        client,
        guildId, 
        `Server configuration error. Reason: ${reason}`,
`**<@${userId}> sent a message we may or may not have been able to handle in <#${channelId}> due to an error.**`,
        ERROR_COLOR);

const WARNING_COLOR = "#ffc107";

/**
 * 
 * @param {Client} client 
 * @param {String} guildId 
 * @param {String} userId 
 * @param {String} channelId 
 * @param {String} message 
 * @param {String} reason 
 * @returns {Promise}
 */
const logWarning = async (client, guildId, userId, channelId, message = "", reason = "unknown") =>
    await logActivity(
        client,
        guildId, 
        `User warned. Reason: ${reason}`,
`**<@${userId}> sent this message in <#${channelId}>**:

\`${message.replace("`", "")}\``,
        WARNING_COLOR);

const ACTION_COLOR = "#dc3545";
const ACTION_NOACTION_COLOR = "#a64d79";

const recentlyActionedUsers = [];

/**
 * 
 * @param {Client} client 
 * @param {String} guildId 
 * @param {String} userId 
 * @param {String} channelId 
 * @param {String} message 
 * @param {String} reason 
 * @returns 
 */
async function logKick(client, guildId, userId, channelId, message = "", reason = "unknown") {
    let alreadyActioned = false;
    let id = `${guildId}-${userId}`

    if (recentlyActionedUsers[id]) alreadyActioned = true;
    else {
        recentlyActionedUsers[id] = true;
        setTimeout(() => {
            delete recentlyActionedUsers[id];
        }, 10000);
    }

    await logActivity(
        client,
        guildId, 
        `User${alreadyActioned ? " already " : " " }kicked. Reason: ${reason}`,
`**<@${userId}> sent this message in <#${channelId}>**:

\`${message.replace("`", "")}\``,
    alreadyActioned ? ACTION_NOACTION_COLOR : ACTION_COLOR);
}

/**
 * 
 * @param {Client} client 
 * @param {String} guildId 
 * @param {String} userId 
 * @param {String} channelId 
 * @param {String} message 
 * @param {String} reason 
 * @returns 
 */
async function logTimeout(client, guildId, userId, channelId, message = "", reason = "unknown") {
    let alreadyActioned = false;
    let id = `${guildId}-${userId}`

    if (recentlyActionedUsers[id]) alreadyActioned = true;
    else {
        recentlyActionedUsers[id] = true;
        setTimeout(() => {
            delete recentlyActionedUsers[id];
        }, 10000);
    }

    await logActivity(
        client,
        guildId, 
        `User${alreadyActioned ? " already " : " " }timed out. Reason: ${reason}`,
`**<@${userId}> sent this message in <#${channelId}>**:

\`${message.replace("`", "")}\``,
    alreadyActioned ? ACTION_NOACTION_COLOR : ACTION_COLOR);
}

/**
 * 
 * @param {Client} client 
 * @param {String} guildId 
 * @param {String} userId 
 * @param {String} channelId 
 * @param {String} message 
 * @param {String} reason 
 * @returns 
 */
async function logBan(client, guildId, userId, channelId, message = "", reason = "unknown") {
    let alreadyActioned = false;
    let id = `${guildId}-${userId}`

    if (recentlyActionedUsers[id]) alreadyActioned = true;
    else {
        recentlyActionedUsers[id] = true;
        setTimeout(() => {
            delete recentlyActionedUsers[id];
        }, 10000);
    }

    await logActivity(
        client,
        guildId, 
        `User${alreadyActioned ? " already " : " " }banned. Reason: ${reason}`,
`**<@${userId}> sent this message in <#${channelId}>**:

\`${message.replace("`", "")}\``,
    alreadyActioned ? ACTION_NOACTION_COLOR : ACTION_COLOR);
}

const INFORMATION_COLOR = "#cccccc";

/**
 * 
 * @param {Client} client 
 * @param {String} guildId 
 * @param {String} userId 
 * @param {String} channelId 
 * @param {String} message 
 * @param {String} reason 
 * @returns {Promise}
 */
const logInformation = async (client, guildId, userId, channelId, message = "", reason = "unknown", messageLink = undefined) =>
    await logActivity(
        client,
        guildId, 
        `${reason}, no warning`,
`**<@${userId}> sent this message in <#${channelId}>**:

\`${message.replace("`", "")}\``,
    INFORMATION_COLOR,
    messageLink);


const SHAME_FLAVOR = {
    kick: {
        color: "#f0ad4e",
        verbs: ["booted", "yeeted out the door", "shown the exit", "given the boot", "punted from the server"],
        headlines: [
            "👢 Another one bites the dust!",
            "🥾 Security has entered the chat!",
            "🚪 Don't let the door hit you on the way out!",
            "👋 Bye Felicia!"
        ]
    },
    timeout: {
        color: "#f7c948",
        verbs: ["sent to the penalty box", "put in timeout", "muted into silence", "benched"],
        headlines: [
            "🤐 Someone needs a moment to think about what they did.",
            "⏳ The naughty chair has a new occupant.",
            "🧊 Chill out time, courtesy of the mods.",
            "🚸 Recess is over. Go sit in the corner."
        ]
    },
    ban: {
        color: "#d9534f",
        verbs: ["banished", "hit with the banhammer", "erased from existence", "sent to the shadow realm"],
        headlines: [
            "🔨 THE BANHAMMER HAS SPOKEN!",
            "☠️ Another scammer bites the dust!",
            "🚫 Access denied. Forever.",
            "🪦 RIP to their little scam, it never stood a chance."
        ]
    }
};

const OUTROS = [
    "Let this be a lesson to us all. 🍿",
    "Nice try, though. A solid B- for effort.",
    "Better luck never, pal.",
    "The bots are watching. Always.",
    "Thanks for playing! 🎪",
    "This has been a public service announcement."
];

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const REDACTED_LINK = "[link redacted for safety]";

/**
 * @description Replace anything link-shaped with a placeholder so a public shame post never republishes a live malicious/tracking/malware URL.
 * @param {String} text
 * @returns {String}
 */
function redactLinks(text) {
    if (!text) return text;

    return text
        // explicit protocol or www-prefixed links
        .replace(/(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi, REDACTED_LINK)
        // bare domain-looking tokens, e.g. discord-nltro.gift/claim
        .replace(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?:\/[^\s<>"')\]]*)?\b/gi, REDACTED_LINK);
}

/**
 * @description Posts a lighthearted public "shame" message when a user is kicked, timed out, or banned.
 * @param {Client} client
 * @param {String} guildId
 * @param {GuildMember} member
 * @param {"kick" | "timeout" | "ban"} action
 * @param {String} reason
 * @param {String} attemptedContent What the user tried to send that got them actioned
 * @returns {Promise<Boolean>}
 */
async function sendShameMessage(client, guildId, member, action, reason = "unknown", attemptedContent = "") {
    try {
        const shameChannelId = getShameChannel(guildId);

        if (!shameChannelId)
            return true;

        let channel = client.channels.cache.get(shameChannelId);

        if (!channel || !channel.send)
            channel = await client.channels.fetch(shameChannelId);

        const flavor = SHAME_FLAVOR[action];

        if (!flavor)
            return false;

        const displayName = member?.displayName ?? "Unknown";
        const username = member?.user?.tag ?? member?.user?.username ?? "unknown#0000";
        const verb = pickRandom(flavor.verbs);

        let evidence = redactLinks((attemptedContent || "").replace(/`/g, "")).trim();
        if (evidence.length > 500) evidence = evidence.substring(0, 500) + "... (truncated)";
        if (!evidence) evidence = "*(nothing but pure chaotic energy — no message content available)*";

        const embed = new EmbedBuilder()
            .setColor(flavor.color)
            .setTitle(pickRandom(flavor.headlines))
            .setThumbnail(member?.displayAvatarURL?.() ?? null)
            .setDescription(`**${displayName}** (\`${username}\`) just got ${verb}.`)
            .addFields(
                { name: "Display Name", value: displayName, inline: true },
                { name: "Username", value: `\`${username}\``, inline: true },
                { name: "Reason", value: reason || "unknown", inline: false },
                { name: "What they tried to sneak past us", value: `\`\`\`${evidence}\`\`\`` }
            )
            .setFooter({ text: pickRandom(OUTROS) })
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        return true;
    } catch (err) {
        console.log(`Error sending shame message: ${err}`);

        return false;
    }
}

module.exports = {
    logActivity,
    logWarning,
    logError,
    logKick,
    logTimeout,
    logBan,
    logInformation,
    forwardMessage,
    sendShameMessage
};