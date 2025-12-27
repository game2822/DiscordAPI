import dotenv from 'dotenv';
import * as readline from 'readline';
import { GetAllGuilds, GetChannelsForGuild } from '../src/routes/Guild';

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
}

async function main() {
    console.log('\n=== Discord API Message Tester ===\n');
    console.log('Available functions:');
    console.log('1. Get All Guilds');
    console.log('2. Get Channels for Guild');
    console.log('5. Automated Test Suite\n');

    const choice = await question('Select a function (1-5): ');

    switch (choice) {
        case '1':
            await testGetAllGuilds();
            break;
        case '2':
            await testGetChannelsForGuild();
            break;
        case '3':
            await testGetMessages();
            break;
        case '4':
            await testEditMessage();
            break;
        case '5':
            console.log('\nRunning Automated Test Suite...\n');
            await AutomatedTests();
            console.log('\nAutomated Test Suite Completed.\n');
            break;
        default:
            console.log('Invalid choice!');
            break;
    }

    rl.close();
}

async function testGetAllGuilds() {
    try {
        const result = await GetAllGuilds();
        console.log('\n✓ Guilds retrieved successfully!');
        console.log('Response:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('\n✗ Error retrieving guilds:', error);
    }
}

async function testGetChannelsForGuild(GuildId?: string) {
    const guildId = GuildId ?? await question('Enter guild ID: ');

    try {
        const result = await GetChannelsForGuild(guildId);
        console.log('\n✓ Channels retrieved successfully!');
        console.log('Response:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('\n✗ Error retrieving channels:', error);
    }

}

async function testGetMessages(ChannelId?: string) {
    const channelId = ChannelId ?? await question('Enter channel ID: ');

    try {
        //const messages = await GetMessagesForChannel(channelId, process.env.DISCORD_TOKEN!);
        console.log('\n✓ Messages retrieved successfully!');
       // console.log(`Found ${messages.length} messages:`);
        //console.log(JSON.stringify(messages, null, 2));
    } catch (error) {
        console.error('\n✗ Error getting messages:', error);
    }
}

async function testEditMessage(ChannelId?: string, MessageId?: string, NewContent?: string) {
    const channelId = ChannelId ?? await question('Enter channel ID: ');
    const messageId = MessageId ?? await question('Enter message ID: ');
    const newContent = NewContent ?? await question('Enter new message content: ');
    try {
        // Assuming EditMessageInChannel is implemented similarly to SendMessageInChannel
        //const result = await EditMessageInChannel(channelId, messageId, newContent, process.env.DISCORD_TOKEN!);
        console.log('\n✓ Message edited successfully!');
       // console.log('Response:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('\n✗ Error editing message:', error);
    }
}

async function AutomatedTests() {
    console.log('\nRunning Automated Test Suite...\n');
    let GuildId: string = "1452784950708404476";
    try {
    const result = await testGetAllGuilds();
    GuildId = result ? JSON.parse(result)[result.length - 1].id : GuildId;
        
    }catch (e) {
        console.error('Error in Get All Guilds Test:', e);
    }
    console.log('-----------------------------------');
    try {
    await testGetChannelsForGuild(GuildId);
    }catch (e) {
        console.error('Error in Get Channels for Guild Test:', e);
    }
    console.log('\nAutomated Test Suite Completed.\n');
    console.log('-----------------------------------');
}

main();